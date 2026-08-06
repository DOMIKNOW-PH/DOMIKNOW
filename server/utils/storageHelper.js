const supabase = require('../config/supabaseClient');

/**
 * Storage Helper Utility
 * Centralizes Supabase Storage operations for DOMIKNOW.
 * 
 * PUBLIC buckets:  property-images
 * PRIVATE buckets: property-documents, tenant-application-documents,
 *                  payment-proofs, maintenance-images, report-attachments,
 *                  dispute-attachments, violation-evidence
 */

// List of buckets that must use signed (private) URLs
const PRIVATE_BUCKETS = [
    'property-documents',
    'tenant-application-documents',
    'payment-proofs',
    'maintenance-images',
    'report-attachments',
    'dispute-attachments',
    'violation-evidence',
    'tenant-report-evidence',
    'landlord-report-evidence'
];

// Signed URL expiry: 7 days (in seconds) — sufficient for demo and capstone use
const SIGNED_URL_EXPIRY = 7 * 24 * 60 * 60;

const ensureBucket = async (bucketName) => {
    try {
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        if (listError) {
            console.error('Error listing buckets:', listError);
            return;
        }
        const exists = buckets && buckets.some(b => b.name === bucketName);
        if (!exists) {
            const isPrivate = PRIVATE_BUCKETS.includes(bucketName);
            const { error: createError } = await supabase.storage.createBucket(bucketName, {
                public: !isPrivate
            });
            if (createError) {
                console.error(`Error creating bucket ${bucketName}:`, createError);
            } else {
                console.log(`Successfully created Supabase storage bucket: ${bucketName} (public: ${!isPrivate})`);
            }
        }
    } catch (err) {
        console.error(`Error in ensureBucket for ${bucketName}:`, err);
    }
};

/**
 * Upload a base64-encoded file to a Supabase Storage bucket.
 * Returns { path, url } where url is:
 *   - a signed URL for private buckets
 *   - a public URL for public buckets
 */
const uploadFile = async (bucketName, filePath, fileInput, mimeType) => {
    // Proactively ensure the target bucket exists before uploading
    await ensureBucket(bucketName);

    let buffer;
    if (Buffer.isBuffer(fileInput)) {
        buffer = fileInput;
    } else if (typeof fileInput === 'string') {
        const base64Data = fileInput.replace(/^data:.*?;base64,/, '');
        buffer = Buffer.from(base64Data, 'base64');
    } else {
        throw new Error('Invalid file input passed to storageHelper (expected Buffer or base64 String).');
    }

    const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, buffer, {
            contentType: mimeType,
            upsert: true
        });

    if (error) throw error;

    // Determine URL type based on bucket privacy
    let fileUrl;
    if (PRIVATE_BUCKETS.includes(bucketName)) {
        // Generate signed URL for private buckets
        const { data: signedData, error: signedErr } = await supabase.storage
            .from(bucketName)
            .createSignedUrl(filePath, SIGNED_URL_EXPIRY);

        if (signedErr) throw signedErr;
        fileUrl = signedData.signedUrl;
    } else {
        // Use public URL for public buckets (e.g. property-images)
        const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);
        fileUrl = urlData.publicUrl;
    }

    return {
        path: filePath,
        url: fileUrl,
        publicUrl: fileUrl,
        signedUrl: fileUrl
    };
};

/**
 * Generate a fresh signed URL for a file stored in a private bucket.
 * Used when a previously stored signed URL has expired.
 */
const getSignedUrl = async (bucketName, filePath, expiresIn = SIGNED_URL_EXPIRY) => {
    const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, expiresIn);

    if (error) throw error;
    return data.signedUrl;
};

/**
 * Check if a bucket is classified as private.
 */
const isPrivateBucket = (bucketName) => {
    return PRIVATE_BUCKETS.includes(bucketName);
};

module.exports = {
    uploadFile,
    getSignedUrl,
    isPrivateBucket,
    PRIVATE_BUCKETS,
    SIGNED_URL_EXPIRY
};
