const landlordModel = require('../models/landlordModel');
const auditLogModel = require('../models/auditLogModel');
const responseHelper = require('../utils/responseHelper');
const supabase = require('../config/supabaseClient');
const { uploadFile, getSignedUrl } = require('../utils/storageHelper');

const landlordController = {
    async createProperty(req, res) {
        try {
            const { 
                property_name, property_type, description, address, barangay, 
                municipality, province, latitude, longitude, monthly_rent, 
                max_occupants, tenant_type_suitability, house_rules, amenities,
                total_floors, total_capacity
            } = req.body;

            const landlordId = req.user.id;

            // 1. Validate required fields & scope
            const validTypes = ['apartment', 'boarding_house', 'bedspace'];
            if (!validTypes.includes(property_type)) {
                return responseHelper.error(res, 'Invalid property type. Scope is limited to Apartment, Boarding House, and Bedspace.');
            }

            if (!property_name || !property_type || !address || !barangay || 
                !municipality || !province || !latitude || !longitude || 
                !max_occupants || !tenant_type_suitability) {
                return responseHelper.error(res, 'All essential property details are required.');
            }

            // 2. Insert property
            const prop = await landlordModel.createProperty({
                landlord_id: landlordId,
                property_name,
                property_type,
                description,
                address,
                barangay,
                municipality,
                province,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                monthly_rent: Math.max(1, parseFloat(monthly_rent || 1)),
                max_occupants: parseInt(max_occupants),
                tenant_type_suitability,
                house_rules,
                total_floors: total_floors ? parseInt(total_floors, 10) : 1,
                total_capacity: total_capacity ? parseInt(total_capacity, 10) : null,
                status: 'pending_review'
            });

            // Initialize property feedback summary record
            await supabase
                .from('property_feedback_summary')
                .upsert([
                    {
                        property_id: prop.id,
                        rating_average: 0.00,
                        total_feedback: 0
                    }
                ], {
                    onConflict: 'property_id'
                });

            // 3. Save amenities
            if (amenities && amenities.length > 0) {
                await landlordModel.saveAmenities(prop.id, amenities);
            }

            // 4. Log audit
            await auditLogModel.log(landlordId, 'SUBMIT_PROPERTY_REGISTRATION', `Landlord submitted property for review: ${property_name}`);

            return responseHelper.success(res, 'Property submitted successfully for admin review.', prop, 201);

        } catch (error) {
            console.error('Create property error:', error);
            return responseHelper.error(res, 'Failed to submit property', error, 500);
        }
    },

    async getMyProperties(req, res) {
        try {
            const properties = await landlordModel.findByLandlordId(req.user.id);
            return responseHelper.success(res, 'Your properties retrieved successfully', properties);
        } catch (error) {
            console.error('Get my properties error:', error);
            return responseHelper.error(res, 'Failed to fetch your properties', error, 500);
        }
    },

    async getMyPropertyById(req, res) {
        try {
            const { id } = req.params;
            let property = await landlordModel.findPropertyById(id, req.user.id);

            if (!property && req.user) {
                property = await landlordModel.findPropertyById(id, null);
                if (property && property.landlord_id !== req.user.id && req.user.role !== 'admin') {
                    property = null;
                }
            }

            if (!property) {
                return responseHelper.error(res, 'Property not found or access denied.', null, 404);
            }

            // Generate fresh signed URLs for property documents
            if (property.documents && property.documents.length > 0) {
                for (const doc of property.documents) {
                    if (doc.file_path) {
                        try {
                            doc.file_url = await getSignedUrl('property-documents', doc.file_path);
                        } catch (err) {
                            console.warn('Signed URL refresh notice:', err.message || err);
                        }
                    }
                }
            }

            return responseHelper.success(res, 'Property details retrieved', property);
        } catch (error) {
            console.error('Get property by id error:', error);
            return responseHelper.error(res, 'Failed to fetch property profile', error.message || error, 500);
        }
    },

    async updateProperty(req, res) {
        try {
            const { id } = req.params;
            const landlordId = req.user.id;
            const { 
                property_name, property_type, description, address, barangay, 
                municipality, province, latitude, longitude, monthly_rent, 
                max_occupants, tenant_type_suitability, house_rules, amenities,
                total_floors, total_capacity
            } = req.body;

            // Update details
            const updated = await landlordModel.updateProperty(id, landlordId, {
                property_name,
                property_type,
                description,
                address,
                barangay,
                municipality,
                province,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                monthly_rent: parseFloat(monthly_rent),
                max_occupants: parseInt(max_occupants),
                tenant_type_suitability,
                house_rules,
                total_floors: total_floors ? parseInt(total_floors, 10) : 1,
                total_capacity: total_capacity ? parseInt(total_capacity, 10) : null,
                status: 'pending_review' // Re-submission resets status to pending_review
            });

            if (!updated) {
                return responseHelper.error(res, 'Property not found, access denied, or status cannot be updated.', null, 400);
            }

            // Sync amenities
            await landlordModel.deleteAmenities(id);
            if (amenities && amenities.length > 0) {
                await landlordModel.saveAmenities(id, amenities);
            }

            await auditLogModel.log(landlordId, 'UPDATE_PROPERTY_SUBMISSION', `Landlord updated property submission: ${property_name}`);

            return responseHelper.success(res, 'Property updated successfully and returned to review queue', updated);

        } catch (error) {
            console.error('Update property error:', error);
            return responseHelper.error(res, 'Failed to update property details', error, 500);
        }
    },

    async uploadImage(req, res) {
        try {
            const { id } = req.params;
            const { file_name, file_url, file_path, mime_type, file_size, is_main, base64_content, replace_image_id } = req.body;
            const landlordId = req.user.id;

            // Verify ownership
            const property = await landlordModel.findPropertyById(id, landlordId);
            if (!property) {
                return responseHelper.error(res, 'Property not found or access denied.', null, 404);
            }

            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(mime_type)) {
                return responseHelper.error(res, 'Invalid image format. Allowed formats: JPG, JPEG, PNG, WEBP.');
            }

            // Validate file size (limit 5MB)
            if (parseInt(file_size) > 5 * 1024 * 1024) {
                return responseHelper.error(res, 'Image size exceeds maximum limit of 5MB.');
            }

            // Clean existing image if replacing
            if (replace_image_id) {
                await supabase
                    .from('property_images')
                    .delete()
                    .eq('id', replace_image_id)
                    .eq('property_id', id);
            } else if (is_main === true || is_main === 'true') {
                // Prevent duplicate main/cover images
                await supabase
                    .from('property_images')
                    .delete()
                    .eq('property_id', id)
                    .eq('is_main', true);
            }

            let finalUrl = file_url;
            let finalPath = file_path;

            // Upload base64 if provided
            if (base64_content) {
                const uniqueName = `${Date.now()}-${file_name}`;
                const storagePath = `properties/${id}/${uniqueName}`;
                const uploadResult = await uploadFile('property-images', storagePath, base64_content, mime_type);
                finalUrl = uploadResult.url;
                finalPath = uploadResult.path;
            }

            const imgRecord = await landlordModel.saveImage({
                property_id: id,
                image_url: finalUrl,
                image_path: finalPath,
                is_main: is_main === true || is_main === 'true'
            });

            await auditLogModel.log(landlordId, 'UPLOAD_PROPERTY_IMAGE', `Landlord uploaded image for property ${id}`);

            return responseHelper.success(res, 'Property image uploaded successfully', imgRecord);

        } catch (error) {
            console.error('Upload image error:', error);
            return responseHelper.error(res, 'Failed to upload property image', error.message || error, 500);
        }
    },

    async uploadDocument(req, res) {
        try {
            const { id } = req.params;
            const { file_name, file_url, file_path, mime_type, file_size, document_type, base64_content, replace_doc_id } = req.body;
            const landlordId = req.user.id;

            // Verify ownership
            const property = await landlordModel.findPropertyById(id, landlordId);
            if (!property) {
                return responseHelper.error(res, 'Property not found or access denied.', null, 404);
            }

            // Validate file type
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
            if (!allowedTypes.includes(mime_type)) {
                return responseHelper.error(res, 'Invalid document format. Allowed formats: PDF, JPG, JPEG, PNG.');
            }

            // Validate size (limit 10MB)
            if (parseInt(file_size) > 10 * 1024 * 1024) {
                return responseHelper.error(res, 'Document size exceeds maximum limit of 10MB.');
            }

            // Clean existing document if replacing
            if (replace_doc_id) {
                await supabase
                    .from('property_documents')
                    .delete()
                    .eq('id', replace_doc_id)
                    .eq('property_id', id);
            } else if (document_type === 'ownership_proof' || document_type === 'government_permit') {
                // Ensure only one active document of these unique types is kept
                await supabase
                    .from('property_documents')
                    .delete()
                    .eq('property_id', id)
                    .eq('document_type', document_type);
            }

            let finalUrl = file_url;
            let finalPath = file_path;

            // Upload base64 if provided
            if (base64_content) {
                const uniqueName = `${Date.now()}-${file_name}`;
                const storagePath = `documents/${id}/${uniqueName}`;
                const uploadResult = await uploadFile('property-documents', storagePath, base64_content, mime_type);
                finalUrl = uploadResult.url;
                finalPath = uploadResult.path;
            }

            const docRecord = await landlordModel.saveDocument({
                property_id: id,
                landlord_id: landlordId,
                document_type,
                file_name,
                file_url: finalUrl,
                file_path: finalPath,
                mime_type,
                file_size: parseInt(file_size),
                status: 'submitted'
            });

            await auditLogModel.log(landlordId, 'UPLOAD_PROPERTY_DOCUMENT', `Landlord uploaded document (${document_type}) for property ${id}`);

            return responseHelper.success(res, 'Property document uploaded successfully', docRecord);

        } catch (error) {
            console.error('Upload document error:', error);
            return responseHelper.error(res, 'Failed to upload property document', error.message || error, 500);
        }
    },

    async getTenantApplications(req, res) {
        try {
            const list = await landlordModel.findTenantApplications(req.user.id);
            return responseHelper.success(res, 'Tenant applications retrieved successfully', list);
        } catch (error) {
            console.error('Get landlord tenant applications error:', error);
            return responseHelper.error(res, 'Failed to fetch tenant applications', error, 500);
        }
    },

    async getTenantApplicationById(req, res) {
        try {
            const { id } = req.params;
            const details = await landlordModel.findApplicationDetails(id, req.user.id);

            if (!details) {
                return responseHelper.error(res, 'Application not found or access denied.', null, 404);
            }

            // Generate fresh signed URLs for tenant application documents
            if (details.documents && details.documents.length > 0) {
                for (const doc of details.documents) {
                    if (doc.file_path) {
                        try {
                            doc.file_url = await getSignedUrl('tenant-application-documents', doc.file_path);
                        } catch (err) {
                            console.error('Error generating signed URL for application doc:', err);
                        }
                    }
                }
            }

            return responseHelper.success(res, 'Application details retrieved', details);
        } catch (error) {
            console.error('Get landlord application by id error:', error);
            return responseHelper.error(res, 'Failed to fetch application details', error, 500);
        }
    },

    async updateApplicationStatus(req, res) {
        try {
            const { id } = req.params;
            const { status, landlord_remarks } = req.body;
            const landlordId = req.user.id;

            const allowedStatuses = ['approved', 'rejected'];
            if (!allowedStatuses.includes(status)) {
                return responseHelper.error(res, 'Invalid status update. Allowed: approved, rejected.');
            }

            const updated = await landlordModel.updateApplicationStatus(id, landlordId, status, landlord_remarks);
            if (!updated) {
                return responseHelper.error(res, 'Application not found or unauthorized status change.', null, 400);
            }

            // Reserve unit/bed if approved
            if (status === 'approved') {
                if (updated.bed_id) {
                    await supabase
                        .from('unit_beds')
                        .update({ status: 'reserved' })
                        .eq('id', updated.bed_id);
                } else if (updated.unit_id) {
                    await supabase
                        .from('property_units')
                        .update({ status: 'reserved' })
                        .eq('id', updated.unit_id);
                }
            } else if (status === 'rejected') {
                // Revert status to available if landlord rejects
                if (updated.bed_id) {
                    await supabase
                        .from('unit_beds')
                        .update({ status: 'available' })
                        .eq('id', updated.bed_id);
                } else if (updated.unit_id) {
                    await supabase
                        .from('property_units')
                        .update({ status: 'available' })
                        .eq('id', updated.unit_id);
                }
            }

            // Log audits
            const actionType = status === 'approved' ? 'APPROVE_TENANT_APPLICATION' : 'REJECT_TENANT_APPLICATION';
            await auditLogModel.log(landlordId, actionType, `Landlord updated tenant application ${id} status to ${status}`);

            return responseHelper.success(res, `Tenant application successfully marked as ${status}`, updated);

        } catch (error) {
            console.error('Update tenant application status error:', error);
            return responseHelper.error(res, 'Failed to update tenant application status', error, 500);
        }
    },

    async deleteProperty(req, res) {
        try {
            const { id } = req.params;
            const landlordId = req.user.id;

            const success = await landlordModel.deleteProperty(id, landlordId);
            if (!success) {
                return responseHelper.error(res, 'Property not found, status is not pending/rejected, or access denied.', null, 404);
            }

            await auditLogModel.log(landlordId, 'DELETE_PROPERTY', `Landlord deleted property ${id}`);

            return responseHelper.success(res, 'Property deleted successfully');
        } catch (error) {
            console.error('Delete property error:', error);
            return responseHelper.error(res, error.message || 'Failed to delete property', error, 500);
        }
    }
};

module.exports = landlordController;
