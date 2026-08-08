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
            // Redirect to correct dashboard
            window.location.href = `/pages/${user.role}/dashboard.html`;
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

    let sidebarHtml = `
        <aside class="sidebar sidebar-${role}">
    `;

    if (role !== 'tenant') {
        sidebarHtml += `
            <div class="sidebar-logo-container">
                <span class="sidebar-logo">DomiKnow</span>
                <span class="navbar-badge ${roleBadgeClass}" style="margin-top:0.4rem; padding: 0.2rem 0.6rem; font-size:0.65rem;">${role.toUpperCase()}</span>
            </div>
        `;
    }

    sidebarHtml += `
            <div class="sidebar-menu">
    `;

    // Path check for highlighting active link (exact page filename match)
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

    // Get page title dynamically from document.title
    let pageTitle = 'Dashboard';
    const docTitle = document.title;
    if (docTitle) {
        pageTitle = docTitle.split(' - ')[0];
    }

    // 2. Main Area and Header HTML
    let topbarHtml = `
        <div class="main-wrapper">
            <header class="topbar">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <button class="mobile-menu-toggle" id="menuToggleBtn">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </button>
                    <h1 class="topbar-title">${pageTitle}</h1>
                </div>
                <div class="topbar-right" style="display: flex; align-items: center; gap: 0.75rem;">
                    <!-- System Notification Bell Button -->
                    <button id="notifBellBtn" title="System Notifications & Alerts" style="position: relative; background: var(--bg-primary); border: 1px solid var(--border-color); cursor: pointer; color: var(--text-primary); width: 38px; height: 38px; border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                        <span id="notifBadgeCounter" class="hidden" style="position: absolute; top: -3px; right: -3px; background: #ef4444; color: white; border-radius: 999px; font-size: 0.65rem; font-weight: 800; padding: 0.1rem 0.35rem; min-width: 16px; text-align: center; box-shadow: 0 2px 6px rgba(239,68,68,0.4);">0</span>
                    </button>
                </div>
            </header>
            <div class="main-content-inner">
                <!-- Content will be moved here -->
            </div>
        </div>
        <div class="sidebar-overlay" id="sidebarOverlay"></div>

        <!-- Slide-over Notification Drawer -->
        <div id="notifDrawer" class="hidden" style="position: fixed; top: 0; right: 0; bottom: 0; width: 400px; max-width: 90vw; background: var(--bg-secondary); border-left: 1px solid var(--border-color); box-shadow: -10px 0 30px rgba(0,0,0,0.18); z-index: 99999; display: flex; flex-direction: column; transition: all 0.3s ease;">
            <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; background: var(--bg-secondary);">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                    <h3 style="margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text-primary);">Notifications</h3>
                </div>
                <div style="display: flex; align-items: center; gap: 0.6rem;">
                    <button id="markAllNotifsReadBtn" style="background: none; border: none; color: #4f46e5; font-size: 0.78rem; font-weight: 800; cursor: pointer;">Mark all read</button>
                    <button id="closeNotifDrawerBtn" style="background: none; border: none; font-size: 1.5rem; color: var(--text-secondary); cursor: pointer; line-height: 1;">&times;</button>
                </div>
            </div>
            <div id="notifListContainer" style="padding: 1rem; overflow-y: auto; flex-grow: 1; display: flex; flex-direction: column; gap: 0.75rem;">
                <div style="font-size: 0.85rem; color: var(--text-muted); text-align: center; font-style: italic; padding: 2rem 0;">Loading notifications...</div>
            </div>
        </div>
    `;

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
    const logoutBtn = document.getElementById('newLogoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('domiknow_token');
            localStorage.removeItem('domiknow_role');
            window.location.href = '/pages/auth/login.html';
        });
    }

    // 5. Initialize System Notification Bell & Drawer
    initNotificationSystem();

    // ⚡ INSTANT FADE-IN: Reveal layout smooth & flicker-free once sidebar is constructed
    document.body.classList.remove('app-loading');
    document.body.classList.add('app-ready');
}

function initNotificationSystem() {
    const bellBtn = document.getElementById('notifBellBtn');
    const badge = document.getElementById('notifBadgeCounter');
    const drawer = document.getElementById('notifDrawer');
    const closeBtn = document.getElementById('closeNotifDrawerBtn');
    const markAllBtn = document.getElementById('markAllNotifsReadBtn');

    if (!bellBtn || !drawer) return;

    bellBtn.addEventListener('click', () => {
        drawer.classList.toggle('hidden');
        if (!drawer.classList.contains('hidden')) {
            fetchNotifications();
        }
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', () => drawer.classList.add('hidden'));
    }

    if (markAllBtn) {
        markAllBtn.addEventListener('click', async () => {
            const token = localStorage.getItem('domiknow_token');
            if (!token) return;
            try {
                await fetch('/api/notifications/read-all', {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                fetchNotifications();
            } catch (err) {
                console.error(err);
            }
        });
    }

    // Initial badge count check
    fetchNotifications();

    async function fetchNotifications() {
        const token = localStorage.getItem('domiknow_token');
        if (!token) return;

        try {
            const res = await fetch('/api/notifications/my', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const result = await res.json();
                const data = result.data || {};
                const list = data.notifications || [];
                const unread = data.unreadCount || 0;

                // Update badge counter
                if (badge) {
                    if (unread > 0) {
                        badge.textContent = unread;
                        badge.classList.remove('hidden');
                    } else {
                        badge.classList.add('hidden');
                    }
                }

                renderNotificationList(list);
            }
        } catch (err) {
            console.error(err);
        }
    }

    function renderNotificationList(list) {
        const container = document.getElementById('notifListContainer');
        if (!container) return;

        if (list.length === 0) {
            container.innerHTML = `<div style="font-size: 0.85rem; color: var(--text-muted); text-align: center; font-style: italic; padding: 2rem 0;">No system notifications available.</div>`;
            return;
        }

        container.innerHTML = '';
        list.forEach(item => {
            const notifCard = document.createElement('div');
            const isUnread = !item.read_status;

            let typeBg = 'rgba(79, 70, 229, 0.08)';
            let typeBorder = '#c7d2fe';
            let iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;

            if (item.type === 'admin_warning') {
                typeBg = '#fffbeb';
                typeBorder = '#fde68a';
                iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
            } else if (item.type === 'admin_suspension') {
                typeBg = '#fff1f2';
                typeBorder = '#fecdd3';
                iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`;
            } else if (item.type === 'report_resolved') {
                typeBg = '#ecfdf5';
                typeBorder = '#a7f3d0';
                iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>`;
            }

            notifCard.style.cssText = `background: ${typeBg}; border: 1px solid ${typeBorder}; padding: 0.9rem 1rem; border-radius: var(--radius-md); font-size: 0.85rem; position: relative; cursor: pointer; transition: transform 0.15s ease; ${isUnread ? 'border-left: 4px solid #4f46e5;' : ''}`;

            notifCard.innerHTML = `
                <div style="display: flex; align-items: flex-start; gap: 10px;">
                    <div style="margin-top: 2px; flex-shrink: 0;">${iconSvg}</div>
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.25rem;">
                            <h4 style="margin: 0; font-size: 0.88rem; font-weight: 800; color: var(--text-primary);">${item.title}</h4>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <span style="font-size: 0.7rem; color: var(--text-muted); white-space: nowrap;">${new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <button class="btn-delete-notif" title="Delete notification" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 0.9rem; padding: 2px 4px; border-radius: 4px; line-height: 1; transition: background 0.2s;" onclick="event.stopPropagation(); deleteSingleNotif('${item.id}');">
                                    🗑️
                                </button>
                            </div>
                        </div>
                        <p style="margin: 0; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.45;">${item.message}</p>
                        <div style="margin-top: 0.45rem; font-size: 0.75rem; font-weight: 800; color: #4f46e5; display: inline-flex; align-items: center; gap: 4px;">
                            View Details &rarr;
                        </div>
                    </div>
                </div>
            `;

            // Click Handler: Mark as read & redirect to Reports Page (Notification stays in list!)
            notifCard.addEventListener('click', async () => {
                const token = localStorage.getItem('domiknow_token');
                if (token && !item.read_status) {
                    try {
                        await fetch(`/api/notifications/${item.id}/read`, {
                            method: 'PUT',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                    } catch (err) {
                        console.error('Error marking notification read:', err);
                    }
                }

                // Update unread badge counter display
                fetchNotifications();

                // Redirect user to the Reports page
                const role = localStorage.getItem('domiknow_role') || 'tenant';
                if (role === 'tenant') {
                    window.location.href = item.reference_id 
                        ? `/pages/tenant/reports.html?id=${item.reference_id}` 
                        : '/pages/tenant/reports.html';
                } else if (role === 'landlord') {
                    window.location.href = '/pages/landlord/reports.html';
                } else {
                    window.location.href = '/pages/tenant/reports.html';
                }
            });

            container.appendChild(notifCard);
        });
    }
}

// Global helper function for single notification deletion
async function deleteSingleNotif(id) {
    const token = localStorage.getItem('domiknow_token');
    if (!token) return;

    try {
        const res = await fetch(`/api/notifications/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            // Re-fetch notifications list
            if (typeof fetchNotifications === 'function') {
                fetchNotifications();
            } else {
                window.location.reload();
            }
        }
    } catch (err) {
        console.error('Error deleting notification:', err);
    }
}

function initSidebarScrollPersistence(sidebar) {
    if (!sidebar) return;

    // Restore scroll position from sessionStorage
    const savedScroll = sessionStorage.getItem('domiknow_sidebar_scroll');
    if (savedScroll !== null) {
        sidebar.scrollTop = parseInt(savedScroll, 10);
    } else {
        const activeLink = sidebar.querySelector('.sidebar-link.active');
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
        const link = e.target.closest('.sidebar-link');
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
