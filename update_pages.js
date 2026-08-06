const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'public', 'pages');

// Page title mappings
const pageTitles = {
  // Tenant pages
  'tenant/dashboard.html': 'Tenant Dashboard',
  'tenant/properties.html': 'Property Discovery',
  'tenant/property-details.html': 'Property Details',
  'tenant/recommendations.html': 'Recommendations',
  'tenant/compare.html': 'Compare Properties',
  'tenant/reservations.html': 'My Reservations',
  'tenant/application-details.html': 'Application Details',
  'tenant/applications.html': 'My Applications',
  'tenant/apply.html': 'Apply for Property',
  'tenant/screening.html': 'Screening',
  'tenant/leases.html': 'My Lease',
  'tenant/billings.html': 'My Billings',
  'tenant/payments.html': 'My Payments',
  'tenant/maintenance.html': 'Maintenance Requests',
  'tenant/reports.html': 'Reports',
  'tenant/disputes.html': 'Disputes',
  'tenant/policy-violations.html': 'Policy Violations',
  'tenant/feedback.html': 'Ratings and Feedback',
  
  // Landlord pages
  'landlord/dashboard.html': 'Landlord Dashboard',
  'landlord/properties.html': 'My Properties',
  'landlord/property-create.html': 'Register Property',
  'landlord/applications.html': 'Tenant Applications',
  'landlord/screening.html': 'Tenant Screening',
  'landlord/leases.html': 'Leases',
  'landlord/utilities.html': 'Utilities',
  'landlord/billings.html': 'Billings',
  'landlord/payments.html': 'Payments',
  'landlord/maintenance.html': 'Maintenance Management',
  'landlord/reports.html': 'Reports',
  'landlord/disputes.html': 'Disputes',
  'landlord/policy-violations.html': 'Policy Violations',
  'landlord/feedback.html': 'Ratings and Feedback',
  'landlord/lease-create.html': 'Create Lease',
  'landlord/maintenance-details.html': 'Maintenance Details',
  'landlord/screening-details.html': 'Screening Details',
  
  // Admin pages
  'admin/dashboard.html': 'Admin Dashboard',
  'admin/users.html': 'User Management',
  'admin/reservations.html': 'Reservation Monitoring',
  'admin/property-review.html': 'Property Review',
  'admin/screening.html': 'Screening Monitor',
  'admin/leases.html': 'Lease Monitor',
  'admin/billings.html': 'Billing Monitor',
  'admin/payments.html': 'Payment Monitor',
  'admin/maintenance.html': 'Maintenance Monitor',
  'admin/reports.html': 'Reports Monitor',
  'admin/disputes.html': 'Disputes Monitor',
  'admin/policy-violations.html': 'Policy Violations Monitor',
  'admin/feedback.html': 'Feedback Monitor',
  'admin/audit-logs.html': 'Audit Logs',
  
  // Maintenance pages
  'maintenance/dashboard.html': 'Maintenance Dashboard',
  'maintenance/tasks.html': 'Assigned Tasks',
  'maintenance/task-details.html': 'Task Details'
};

function getRoleFromPath(relativePath) {
  // Normalize path separators
  const normalizedPath = relativePath.replace(/\\/g, '/');
  if (normalizedPath.includes('/tenant/')) return 'tenant';
  if (normalizedPath.includes('/landlord/')) return 'landlord';
  if (normalizedPath.includes('/admin/')) return 'admin';
  if (normalizedPath.includes('/maintenance/')) return 'maintenance';
  return null;
}

function updateHtmlFile(filePath, relativePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Normalize path separators
  const normalizedPath = relativePath.replace(/\\/g, '/');
  
  // Debug logging
  console.log(`Processing: ${normalizedPath}`);
  
  const role = getRoleFromPath(normalizedPath);
  if (!role) {
    console.log(`Skipping (no role): ${normalizedPath}`);
    return; // Skip auth pages
  }
  
  const pageTitle = pageTitles[normalizedPath] || 'Dashboard';
  
  // Update body tag
  content = content.replace(
    /<body>/,
    `<body class="app-loading" data-role="${role}" data-page-title="${pageTitle}">`
  );
  
  // Remove old navbar (from <!-- Navbar --> to </nav>)
  content = content.replace(
    /<!-- Navbar -->[\s\S]*?<\/nav>\s*/,
    ''
  );
  
  // Update script tags
  content = content.replace(
    /<script src="..\/..\/js\/auth\.js"><\/script>\s*<script src="..\/..\/js\/dashboard\.js"><\/script>/,
    `<script src="../../js/navigationConfig.js"></script>\n    <script src="../../js/layout.js"></script>`
  );
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated: ${normalizedPath}`);
}

function walkDirectory(dir, baseDir = pagesDir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDirectory(filePath, baseDir);
    } else if (file.endsWith('.html')) {
      const relativePath = path.relative(baseDir, filePath).replace(/\\/g, '/');
      updateHtmlFile(filePath, relativePath);
    }
  }
}

// Run the update
console.log('Starting HTML page updates...');
walkDirectory(pagesDir);
console.log('Update complete!');
