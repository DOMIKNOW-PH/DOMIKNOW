// Dashboard guard and initialization

// Run on page load
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Check token
    const token = localStorage.getItem('domiknow_token');
    if (!token) {
        window.location.href = '/pages/auth/login.html';
        return;
    }

    // Determine expected role based on path
    const path = window.location.pathname;
    
    // Auto-redirect removed dashboard pages to properties.html
    if (path.includes('/tenant/dashboard.html')) {
        window.location.href = '/pages/tenant/properties.html';
        return;
    }
    if (path.includes('/landlord/dashboard.html')) {
        window.location.href = '/pages/landlord/properties.html';
        return;
    }

    let expectedRole = null;
    if (path.includes('/tenant/')) expectedRole = 'tenant';
    if (path.includes('/landlord/')) expectedRole = 'landlord';
    if (path.includes('/maintenance/')) expectedRole = 'maintenance';
    if (path.includes('/admin/')) expectedRole = 'admin';

    const storedRole = localStorage.getItem('domiknow_role');
    const activeRole = expectedRole || storedRole || 'tenant';

    // ⚡ INSTANT SIDEBAR RENDER: Render layout synchronously BEFORE network fetch
    // Eliminates any millisecond delay or layout shift on refresh
    renderNewDashboardLayout({ role: activeRole });

    try {
        // 2. Fetch user data to verify token and role
        const response = await fetch('/api/dashboard/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            // Token invalid or expired
            localStorage.removeItem('domiknow_token');
            localStorage.removeItem('domiknow_role');
            window.location.href = '/pages/auth/login.html';
            return;
        }

        const result = await response.json();
        const user = result.data;

        // 3. Verify role
        if (expectedRole && user.role !== expectedRole) {
            if (user.role === 'tenant' || user.role === 'landlord') {
                window.location.href = `/pages/${user.role}/properties.html`;
            } else {
                window.location.href = `/pages/${user.role}/dashboard.html`;
            }
            return;
        }

        // 4. Populate UI
        populateDashboardUI(user);

    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
});

function populateDashboardUI(user) {
    // Populate User Name
    const userNameEls = document.querySelectorAll('.user-name');
    userNameEls.forEach(el => el.textContent = user.full_name);

    // Populate Account Status
    const statusEl = document.getElementById('accountStatus');
    if (statusEl) {
        statusEl.textContent = user.account_status.toUpperCase();
        
        // Color coding for status using custom semantic classes
        statusEl.className = 'status-badge';
        if (user.account_status === 'active') {
            statusEl.classList.add('status-active');
        } else if (user.account_status === 'pending') {
            statusEl.classList.add('status-pending');
        } else {
            statusEl.classList.add('status-rejected');
        }
    }

    // Role specific pending message
    const pendingMsg = document.getElementById('pendingApprovalMsg');
    if (pendingMsg && user.account_status === 'pending') {
        pendingMsg.classList.remove('hidden');
    }

    // Modern Sidebar & Layout Injection
    renderNewDashboardLayout(user);
}

function renderNewDashboardLayout(user) {
    // Don't run on login/register pages
    if (window.location.pathname.includes('/auth/') || window.location.pathname.includes('/login') || window.location.pathname.includes('/register')) return;

    // Check if already rendered
    if (document.querySelector('.dashboard-layout')) return;

    const oldNavbar = document.querySelector('nav.navbar');
    if (oldNavbar) oldNavbar.remove();

    // Define sidebar link structures based on role
    const linksByRole = {
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
                    { label: 'Users', href: 'users.html' },
                    { label: 'Property Review', href: 'property-review.html' },
                    { label: 'Reservation Monitoring', href: 'reservations.html' }
                ]
            },
            {
                section: 'Monitoring & Governance',
                items: [
                    { label: 'Payment Monitor', href: 'payments.html' },
                    { label: 'Reports Triage', href: 'reports.html' },
                    { label: 'Policy Management', href: 'policy-management.html' },
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

    const role = (user && user.role) ? user.role : 'tenant';
    const menuGroups = (typeof NAVIGATION_CONFIG !== 'undefined' && NAVIGATION_CONFIG[role]) ? NAVIGATION_CONFIG[role] : (linksByRole[role] || []);

    // Create main container layout
    const dashboardLayout = document.createElement('div');
    dashboardLayout.className = `dashboard-layout`;

    // 1. Sidebar HTML
    let roleBadgeClass = 'navbar-badge-tenant';
    if (role === 'landlord') roleBadgeClass = 'navbar-badge-landlord';
    if (role === 'maintenance') roleBadgeClass = 'navbar-badge-maintenance';
    if (role === 'admin') roleBadgeClass = 'navbar-badge-admin';

    let sidebarHtml = '';
    const currentPath = window.location.pathname;

    if (role === 'tenant') {
        // Render advanced collapsible sidebar for tenant
        const isCollapsed = localStorage.getItem('domiknow_sidebar_collapsed') === 'true';
        const collapsedClass = isCollapsed ? 'collapsed' : '';
        
        if (isCollapsed) {
            dashboardLayout.classList.add('sidebar-collapsed');
        }
        
        sidebarHtml = `
            <aside class="sidebar sidebar-tenant" id="domiknowSidebar">
                <div style="height: 1.5rem;"></div>
                
                <!-- Menu items list -->
                <div class="sidebar-menu">
                    <div class="sidebar-section-title">Overview</div>
        `;
        
        const overviewGroup = menuGroups.find(g => g.section === 'Overview');
        if (overviewGroup) {
            overviewGroup.items.forEach(item => {
                let isGroupActive = false;
                if (item.subItems) {
                    item.subItems.forEach(sub => {
                        if (currentPath.endsWith(sub.href)) {
                            isGroupActive = true;
                        }
                    });
                }
                
                const activeGroupKey = `domiknow_group_${item.label.toLowerCase()}`;
                let isExpanded = sessionStorage.getItem(activeGroupKey);
                if (isExpanded === null) {
                    isExpanded = isGroupActive ? 'true' : 'false';
                }
                
                const expandedClass = isExpanded === 'true' ? 'expanded' : '';
                const groupActiveClass = isGroupActive ? 'group-active' : '';
                
                if (item.subItems && item.subItems.length === 1) {
                    sidebarHtml += `
                        <div class="sidebar-group ${groupActiveClass}" data-group="${item.label.toLowerCase()}">
                            <a href="${item.subItems[0].href}" class="sidebar-group-header" style="text-decoration: none;">
                                <span class="sidebar-group-header-left">
                                    ${getTenantIcon(item.label)}
                                    <span class="sidebar-group-label">${item.label}</span>
                                </span>
                            </a>
                        </div>
                    `;
                } else {
                    sidebarHtml += `
                        <div class="sidebar-group ${expandedClass} ${groupActiveClass}" data-group="${item.label.toLowerCase()}">
                            <button class="sidebar-group-header">
                                <span class="sidebar-group-header-left">
                                    ${getTenantIcon(item.label)}
                                    <span class="sidebar-group-label">${item.label}</span>
                                </span>
                                <span class="sidebar-group-arrow">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </span>
                            </button>
                            <div class="sidebar-sub-menu">
                    `;
                    
                    if (item.subItems) {
                        item.subItems.forEach(sub => {
                            const isSubActive = currentPath.endsWith(sub.href);
                            const subActiveClass = isSubActive ? 'active' : '';
                            sidebarHtml += `
                                <a href="${sub.href}" class="sidebar-sub-link ${subActiveClass}">
                                    <span class="sub-link-dot"></span>
                                    <span class="sidebar-sub-label">${sub.label}</span>
                                </a>
                            `;
                        });
                    }
                    
                    sidebarHtml += `
                            </div>
                        </div>
                    `;
                }
            });
        }
        
        const userName = (user && user.full_name) ? user.full_name : 'Loading...';
        const userEmail = (user && user.email) ? user.email : 'loading@domiknow.com';
        const userAvatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(userName)}`;
        
        sidebarHtml += `
                </div>
                <!-- Bottom Sidebar Footer with Logout Button -->
                <div style="padding: 1rem; border-top: 1px solid #e2e8f0; margin-top: auto;">
                    <button id="newLogoutBtn" class="sidebar-link logout-btn" style="width: 100%; border: none; background: #fef2f2; color: #ef4444; border-radius: 12px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 0.65rem; padding: 0.75rem 1rem; transition: background 0.2s;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        `;
    } else {
        // Fallback to old design for other roles
        sidebarHtml = `
            <aside class="sidebar sidebar-${role}">
                <div class="sidebar-logo-container">
                    <span class="sidebar-logo">DomiKnow</span>
                    <span class="navbar-badge ${roleBadgeClass}" style="margin-top:0.4rem; padding: 0.2rem 0.6rem; font-size:0.65rem;">${role.toUpperCase()}</span>
                </div>
                <div class="sidebar-menu">
        `;
        
        const pageFilename = window.location.pathname.split('/').pop() || 'dashboard.html';
        menuGroups.forEach(group => {
            if (!(role === 'tenant' && group.section === 'Main')) {
                sidebarHtml += `<div class="sidebar-section-title">${group.section}</div>`;
            }
            group.items.forEach(item => {
                const isItemActive = (pageFilename === item.href);
                const activeClass = isItemActive ? 'active' : '';
                sidebarHtml += `<a href="${item.href}" class="sidebar-link ${activeClass}">
                    ${getLinkIcon(item.label)}
                    <span>${item.label}</span>
                </a>`;
            });
        });
        
        sidebarHtml += `
                </div>
                <!-- Bottom Sidebar Footer with Logout Button -->
                <div style="padding: 1rem; border-top: 1px solid var(--border-color); margin-top: auto;">
                    <button id="newLogoutBtn" class="sidebar-link" style="width: 100%; border: none; background: rgba(239, 68, 68, 0.08); color: var(--error); border-radius: var(--radius-md); font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.65rem; padding: 0.75rem 1rem; transition: background 0.2s;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        `;
    }

    // Get page title dynamically from document.title
    let pageTitle = 'Dashboard';
    const docTitle = document.title;
    if (docTitle) {
        pageTitle = docTitle.split(' - ')[0];
    }

    // 2. Main Area and Header HTML
    let topbarHtml = '';
    
    if (role === 'tenant') {
        const activeTab = currentPath.includes('properties.html') ? 'discovery' :
                          currentPath.includes('applications.html') ? 'applications' :
                          currentPath.includes('leases.html') ? 'leases' :
                          currentPath.includes('billings.html') ? 'payments' :
                          currentPath.includes('reports.html') ? 'reports' :
                          (currentPath.includes('maintenance.html') || currentPath.includes('disputes.html') || currentPath.includes('feedback.html')) ? 'support' : '';

        // Inject Bottom Nav CSS Styles
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            .bottom-nav-bar {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                height: 64px;
                background-color: #FFFFFF;
                border-top: 1px solid #E2E8F0;
                display: none;
                flex-direction: row;
                justify-content: space-around;
                align-items: center;
                box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.05);
                z-index: 9999;
                padding-bottom: env(safe-area-inset-bottom);
            }

            .bottom-nav-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                width: 48px;
                height: 48px;
                border-radius: 12px;
                color: #042458;
                text-decoration: none;
                transition: all 0.2s ease;
                position: relative;
                background: none;
                border: none;
                cursor: pointer;
            }

            .bottom-nav-item.active {
                color: #0355F3;
            }

            .nav-sheet-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(4, 36, 88, 0.4);
                z-index: 10000;
                display: flex;
                align-items: flex-end;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }

            .nav-sheet-overlay.open {
                opacity: 1;
                pointer-events: auto;
            }

            .nav-sheet {
                background: #FFFFFF;
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
                border-top-left-radius: 20px;
                border-top-right-radius: 20px;
                padding: 24px;
                box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.15);
                transform: translateY(100%);
                transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                box-sizing: border-box;
            }

            .nav-sheet-overlay.open .nav-sheet {
                transform: translateY(0);
            }

            .nav-sheet-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }

            .nav-sheet-title {
                font-size: 18px;
                font-weight: 600;
                color: #042458;
                margin: 0;
            }

            .nav-sheet-close {
                background: none;
                border: none;
                font-size: 24px;
                color: #042458;
                cursor: pointer;
                line-height: 1;
            }

            .nav-sheet-menu {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .nav-sheet-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 16px;
                border-radius: 12px;
                color: #042458;
                text-decoration: none;
                font-size: 15px;
                font-weight: 600;
                background-color: #F8FAFC;
                transition: background-color 0.2s ease;
            }

            .nav-sheet-item:active {
                background-color: #F1F5F9;
            }
            
            .nav-sheet-item.logout {
                color: #EF4444;
                background-color: #FEF2F2;
            }

            /* Responsive rules for mobile viewport */
            @media (max-width: 768px) {
                .sidebar-tenant {
                    display: none !important;
                }
                .main-wrapper {
                    margin-left: 0 !important;
                    padding-bottom: 72px !important;
                }
                .main-content-inner {
                    padding: 16px !important;
                    min-height: calc(100vh - 72px) !important;
                    background-color: #F8FAFC !important;
                }
                .bottom-nav-bar {
                    display: flex !important;
                }
            }
        `;
        document.head.appendChild(styleEl);

        topbarHtml = `
            <div class="main-wrapper">
                <div class="main-content-inner">
                    <!-- Content will be moved here -->
                </div>
            </div>
            
            <!-- Sticky Bottom Navigation Bar -->
            <div class="bottom-nav-bar">
                <a href="/pages/tenant/properties.html" class="bottom-nav-item ${activeTab === 'discovery' ? 'active' : ''}" title="Explore">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </a>
                <a href="/pages/tenant/applications.html" class="bottom-nav-item ${activeTab === 'applications' ? 'active' : ''}" title="Applications">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                </a>
                <a href="/pages/tenant/leases.html" class="bottom-nav-item ${activeTab === 'leases' ? 'active' : ''}" title="Lease">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                </a>
                <a href="/pages/tenant/billings.html" class="bottom-nav-item ${activeTab === 'payments' ? 'active' : ''}" title="Payments">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line>
                    </svg>
                </a>
                <a href="/pages/tenant/reports.html" class="bottom-nav-item ${activeTab === 'reports' ? 'active' : ''}" title="Reports">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                </a>
                <button id="btnOpenNavSheet" class="bottom-nav-item ${activeTab === 'support' ? 'active' : ''}" title="Help & Settings">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                </button>
            </div>

            <!-- Bottom Sheet Support & Settings Modal -->
            <div id="navSheetOverlay" class="nav-sheet-overlay">
                <div class="nav-sheet">
                    <div class="nav-sheet-header">
                        <h3 class="nav-sheet-title">Help & Settings</h3>
                        <button id="btnCloseNavSheet" class="nav-sheet-close">&times;</button>
                    </div>
                    <div class="nav-sheet-menu">
                        <a href="/pages/tenant/maintenance.html" class="nav-sheet-item">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle;"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
                            <span>Maintenance Requests</span>
                        </a>
                        <a href="/pages/tenant/disputes.html" class="nav-sheet-item">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                            <span>Disputes</span>
                        </a>
                        <a href="/pages/tenant/feedback.html" class="nav-sheet-item">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                            <span>Ratings & Feedback</span>
                        </a>
                        <button id="sheetLogoutBtn" class="nav-sheet-item logout" style="border: none; text-align: left; width: 100%; cursor: pointer;">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle;"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                            <span>Log out</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    } else {
        topbarHtml = `
            <div class="main-wrapper">
                <div class="main-content-inner">
                    <!-- Content will be moved here -->
                </div>
            </div>
            <div class="sidebar-overlay" id="sidebarOverlay"></div>
        `;
    }

    dashboardLayout.innerHTML = sidebarHtml + topbarHtml;

    // Get original page content direct children of body (excluding script, style, modals, overlays)
    const bodyChildren = Array.from(document.body.children);
    const contentTarget = dashboardLayout.querySelector('.main-content-inner');

    // Insert the new dashboard layout as the first element in body
    document.body.insertBefore(dashboardLayout, document.body.firstChild);

    // Move the appropriate children inside the main-content-inner
    bodyChildren.forEach(child => {
        if (
            child.tagName !== 'SCRIPT' &&
            child.tagName !== 'STYLE' &&
            child !== dashboardLayout &&
            child.id !== 'updateModal' &&
            child.id !== 'reservationModal' &&
            !child.classList.contains('modal') &&
            !child.classList.contains('modal-overlay')
        ) {
            contentTarget.appendChild(child);
        }
    });

    // 3. Attach interactive behaviors
    // Mobile Sidebar toggle
    const menuToggleBtn = document.getElementById('menuToggleBtn');
    const sidebar = dashboardLayout.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (menuToggleBtn && sidebar && overlay) {
        menuToggleBtn.addEventListener('click', () => {
            sidebar.classList.add('open');
            overlay.classList.add('open');
        });

        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('open');
        });
    }

    // 4. Attach Sidebar Scroll Persistence (remembers scroll position across page transitions)
    initSidebarScrollPersistence(sidebar);

    // Logout button behavior
    const handleGlobalLogout = () => {
        localStorage.removeItem('domiknow_token');
        localStorage.removeItem('domiknow_role');
        localStorage.removeItem('domiknow_user');
        window.location.href = '/pages/auth/login.html';
    };

    ['newLogoutBtn', 'logoutBtn', 'sheetLogoutBtn'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', handleGlobalLogout);
        }
    });

    // --- Tenant Specific Custom Interactive Behaviors ---
    const isTenant = sidebar && sidebar.classList.contains('sidebar-tenant');
    if (isTenant || document.getElementById('btnOpenNavSheet')) {
        const sidebarEl = document.getElementById('domiknowSidebar');
        
        // Bottom Nav Sheet open/close toggles
        const btnOpenNavSheet = document.getElementById('btnOpenNavSheet');
        const btnCloseNavSheet = document.getElementById('btnCloseNavSheet');
        const navSheetOverlay = document.getElementById('navSheetOverlay');
        const sheetLogoutBtn = document.getElementById('sheetLogoutBtn');

        if (btnOpenNavSheet && btnCloseNavSheet && navSheetOverlay) {
            btnOpenNavSheet.addEventListener('click', () => {
                navSheetOverlay.classList.add('open');
            });

            btnCloseNavSheet.addEventListener('click', () => {
                navSheetOverlay.classList.remove('open');
            });

            navSheetOverlay.addEventListener('click', (e) => {
                if (e.target === navSheetOverlay) {
                    navSheetOverlay.classList.remove('open');
                }
            });
        }

        if (sheetLogoutBtn) {
            sheetLogoutBtn.addEventListener('click', () => {
                localStorage.removeItem('domiknow_token');
                localStorage.removeItem('domiknow_role');
                window.location.href = '/pages/auth/login.html';
            });
        }

        if (sidebarEl) {
            // 1. Group Header accordion toggles
            const groupHeaders = sidebarEl.querySelectorAll('.sidebar-group-header');
            groupHeaders.forEach(header => {
                if (header.tagName.toLowerCase() !== 'button') return;
                header.addEventListener('click', (e) => {
                    const group = header.closest('.sidebar-group');
                    const groupName = group.getAttribute('data-group');
                    const isExpanded = group.classList.toggle('expanded');
                    sessionStorage.setItem(`domiknow_group_${groupName}`, isExpanded ? 'true' : 'false');
                });
            });
        }

        // 5. Keyboard Shortcuts alert trigger
        const shortcutsBtn = document.getElementById('popoverShortcutsBtn');
        if (shortcutsBtn) {
            shortcutsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                alert('Shortcuts:\nAlt + D: Discovery\nAlt + A: Applications\nAlt + L: Leases\nAlt + P: Payments\nAlt + S: Support\nAlt + R: Reports');
            });
        }
    }

    // ⚡ INSTANT FADE-IN: Reveal layout smooth & flicker-free once sidebar is constructed
    document.body.classList.remove('app-loading');
    document.body.classList.add('app-ready');
}

function initSidebarScrollPersistence(sidebar) {
    if (!sidebar) return;

    // Restore scroll position from sessionStorage
    const savedScroll = sessionStorage.getItem('domiknow_sidebar_scroll');
    if (savedScroll !== null) {
        sidebar.scrollTop = parseInt(savedScroll, 10);
    } else {
        const activeLink = sidebar.querySelector('.sidebar-link.active, .sidebar-sub-link.active');
        if (activeLink) {
            activeLink.scrollIntoView({ block: 'nearest' });
        }
    }

    // Save scroll position on scroll
    sidebar.addEventListener('scroll', () => {
        sessionStorage.setItem('domiknow_sidebar_scroll', sidebar.scrollTop);
    }, { passive: true });

    // Save scroll position and smoothly fade out ONLY main content panel on link click (sidebar stays rock solid)
    sidebar.addEventListener('click', (e) => {
        const link = e.target.closest('.sidebar-link, .sidebar-sub-link');
        if (link && link.href) {
            sessionStorage.setItem('domiknow_sidebar_scroll', sidebar.scrollTop);
            const mainContent = document.querySelector('.main-content-inner');
            if (mainContent) {
                mainContent.style.opacity = '0';
            }
        }
    });
}

// Minimal inline SVG icons for sidebar links (Serious & System-like)
function getLinkIcon(label) {
    const baseSvg = (pathData) => `<svg class="nav-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.75rem; flex-shrink: 0; transition: transform var(--transition-fast);">${pathData}</svg>`;
    
    const icons = {
        'Dashboard': baseSvg('<rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect>'),
        'Property Discovery': baseSvg('<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>'),
        'Recommendations': baseSvg('<circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>'),
        'Compare Properties': baseSvg('<path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"></path>'),
        
        'My Reservations': baseSvg('<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>'),
        'Reservation Monitoring': baseSvg('<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>'),
        
        'My Applications': baseSvg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline>'),
        'Tenant Applications': baseSvg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline>'),
        
        'Screening': baseSvg('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>'),
        'Tenant Screening': baseSvg('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>'),
        'Screening Monitor': baseSvg('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>'),
        
        'My Lease': baseSvg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline>'),
        'Leases': baseSvg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline>'),
        'Lease Monitor': baseSvg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline>'),
        
        'My Billings': baseSvg('<rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line>'),
        'Billings': baseSvg('<rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line>'),
        'Billing Monitor': baseSvg('<rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line>'),
        
        'My Payments': baseSvg('<line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>'),
        'Payments': baseSvg('<line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>'),
        'Payment Monitor': baseSvg('<line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>'),
        
        'Maintenance Requests': baseSvg('<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>'),
        'Maintenance Management': baseSvg('<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>'),
        'Maintenance Monitor': baseSvg('<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>'),
        'Assigned Tasks': baseSvg('<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>'),
        
        'Reports': baseSvg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line>'),
        'Reports Monitor': baseSvg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line>'),
        
        'Disputes': baseSvg('<circle cx="6" cy="19" r="3"></circle><circle cx="18" cy="19" r="3"></circle><path d="M6 12V6a6 6 0 1 1 12 0v6M12 2v10"></path>'),
        'Disputes Monitor': baseSvg('<circle cx="6" cy="19" r="3"></circle><circle cx="18" cy="19" r="3"></circle><path d="M6 12V6a6 6 0 1 1 12 0v6M12 2v10"></path>'),
        
        'Policy Violations': baseSvg('<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>'),
        'Policy Violations Monitor': baseSvg('<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>'),
        
        'Ratings and Feedback': baseSvg('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>'),
        'Feedback Monitor': baseSvg('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>'),
        
        'My Properties': baseSvg('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>'),
        'Property Review': baseSvg('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>'),
        'Register Property': baseSvg('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>'),
        'User Management': baseSvg('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>'),
        'Utilities': baseSvg('<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>'),
        'Audit Logs': baseSvg('<line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line>')
    };
    
    return icons[label] || baseSvg('<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line>');
}

// Custom Premium Icons for Tenant Sidebar redesign
function getTenantIcon(label) {
    const icons = {
        'Home': `<svg class="nav-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
        'Discovery': `<svg class="nav-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`,
        'Applications': `<svg class="nav-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`,
        'Leases': `<svg class="nav-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,
        'Payments': `<svg class="nav-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>`,
        'Support': `<svg class="nav-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
        'Reports': `<svg class="nav-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>`,
        'Help': `<svg class="nav-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
        'Setting': `<svg class="nav-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`
    };
    return icons[label] || '';
}
