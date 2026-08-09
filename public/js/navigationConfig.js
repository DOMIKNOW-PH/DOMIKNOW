// Shared Navigation Configuration for DOMIKNOW System
// This file contains role-based navigation items for the sidebar

const NAVIGATION_CONFIG = {
  tenant: [
    {
      section: 'Overview',
      items: [
        {
          label: 'Discovery',
          icon: 'Discovery',
          subItems: [
            { label: 'Properties', href: 'properties.html' }
          ]
        },
        {
          label: 'Applications',
          icon: 'Applications',
          subItems: [
            { label: 'My Applications', href: 'applications.html' }
          ]
        },
        {
          label: 'Leases',
          icon: 'Leases',
          subItems: [
            { label: 'My Lease', href: 'leases.html' }
          ]
        },
        {
          label: 'Payments',
          icon: 'Payments',
          subItems: [
            { label: 'Billings & Payments', href: 'billings.html' }
          ]
        },
        {
          label: 'Support',
          icon: 'Support',
          subItems: [
            { label: 'Maintenance Requests', href: 'maintenance.html' },
            { label: 'Disputes', href: 'disputes.html' },
            { label: 'Ratings & Feedback', href: 'feedback.html' }
          ]
        },
        {
          label: 'Reports',
          icon: 'Reports',
          subItems: [
            { label: 'My Reports', href: 'reports.html' }
          ]
        }
      ]
    }
  ],
  landlord: [
    {
      section: 'Main',
      items: [
        { label: 'My Properties', href: 'properties.html' },
        { label: 'Register Property', href: 'property-create.html' }
      ]
    },
    {
      section: 'Tenant Management',
      items: [
        { label: 'Tenant Applications', href: 'applications.html' },
        { label: 'Leases', href: 'leases.html' }
      ]
    },
    {
      section: 'Rental Operations',
      items: [
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
        { label: 'Ratings and Feedback', href: 'feedback.html' }
      ]
    }
  ],
  admin: [
    {
      section: 'Main',
      items: [
        { label: 'User Management', href: 'users.html' },
        { label: 'Property Review', href: 'property-review.html' },
        { label: 'Reservation Monitoring', href: 'reservations.html' }
      ]
    },
    {
      section: 'Monitoring & Logs',
      items: [
        { label: 'Payment Monitor', href: 'payments.html' },
        { label: 'Reports Triage', href: 'reports.html' },
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
    }
  ]
};
