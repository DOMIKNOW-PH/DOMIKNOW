// Shared Navigation Configuration for DOMIKNOW System
// This file contains role-based navigation items for the sidebar

const NAVIGATION_CONFIG = {
  tenant: [
    {
      section: 'Main',
      items: [
        { label: 'Dashboard', href: 'dashboard.html' },
        { label: 'Property Discovery', href: 'properties.html' }
      ]
    },
    {
      section: 'Rental Process',
      items: [
        { label: 'My Applications', href: 'applications.html' },
        { label: 'My Lease', href: 'leases.html' }
      ]
    },
    {
      section: 'Payments',
      items: [
        { label: 'My Billings', href: 'billings.html' },
        { label: 'My Payments', href: 'payments.html' }
      ]
    },
    {
      section: 'Support',
      items: [
        { label: 'Maintenance Requests', href: 'maintenance.html' },
        { label: 'Reports', href: 'reports.html' },
        { label: 'Disputes', href: 'disputes.html' },
        { label: 'Ratings and Feedback', href: 'feedback.html' }
      ]
    }
  ],
  landlord: [
    {
      section: 'Main',
      items: [
        { label: 'Dashboard', href: 'dashboard.html' },
        { label: 'My Properties', href: 'properties.html' },
        { label: 'Register Property', href: 'property-create.html' }
      ]
    },
    {
      section: 'Tenant Management',
      items: [
        { label: 'Tenant Applications', href: 'applications.html' },
        { label: 'Tenant Screening', href: 'screening.html' },
        { label: 'Leases', href: 'leases.html' }
      ]
    },
    {
      section: 'Rental Operations',
      items: [
        { label: 'Utilities', href: 'utilities.html' },
        { label: 'Billings', href: 'billings.html' },
        { label: 'Payments', href: 'payments.html' }
      ]
    },
    {
      section: 'Support and Regulation',
      items: [
        { label: 'Maintenance Management', href: 'maintenance.html' },
        { label: 'Reports', href: 'reports.html' },
        { label: 'Disputes', href: 'disputes.html' },
        { label: 'Policy Violations', href: 'policy-violations.html' },
        { label: 'Ratings and Feedback', href: 'feedback.html' }
      ]
    }
  ],
  admin: [
    {
      section: 'Main',
      items: [
        { label: 'Dashboard', href: 'dashboard.html' },
        { label: 'User Management', href: 'users.html' }
      ]
    },
    {
      section: 'Property and Rental',
      items: [
        { label: 'Property Review', href: 'property-review.html' },
        { label: 'Screening Monitor', href: 'screening.html' },
        { label: 'Lease Monitor', href: 'leases.html' },
        { label: 'Billing Monitor', href: 'billings.html' },
        { label: 'Payment Monitor', href: 'payments.html' }
      ]
    },
    {
      section: 'System Monitoring',
      items: [
        { label: 'Maintenance Monitor', href: 'maintenance.html' },
        { label: 'General Reports Monitor', href: 'reports.html' },
        { label: 'Tenant Reports Monitor', href: 'tenant-reports.html' },
        { label: 'Landlord Reports Monitor', href: 'landlord-reports.html' },
        { label: 'Disputes Monitor', href: 'disputes.html' },
        { label: 'Policy Violations Monitor', href: 'policy-violations.html' },
        { label: 'Feedback Monitor', href: 'feedback.html' },
        { label: 'Audit Logs', href: 'audit-logs.html' }
      ]
    }
  ],
  maintenance: [
    {
      section: 'Main',
      items: [
        { label: 'Dashboard', href: 'dashboard.html' },
        { label: 'Assigned Tasks', href: 'tasks.html' }
      ]
    },
    {
      section: 'Support',
      items: [
        { label: 'Task Details', href: 'task-details.html' }
      ]
    }
  ]
};
