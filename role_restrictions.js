// role-restrictions.js
// Add this file to your js/ folder and include it in index.html

// Role-based permissions
const ROLE_PERMISSIONS = {
    admin: {
        canViewDashboard: true,
        canViewFlights: true,
        canEditFlights: true,
        canDeleteFlights: true,
        canViewPassengers: true,
        canEditPassengers: true,
        canViewGates: true,
        canEditGates: true,
        canViewRoutes: true,
        canEditRoutes: true,
        canViewStats: true,
        canViewActivityLog: true,
        restrictedPages: [] // Admin can access all pages
    },
    supervisor: {
        canViewDashboard: true,
        canViewFlights: true,
        canEditFlights: false,
        canDeleteFlights: false,
        canViewPassengers: true,
        canEditPassengers: false,
        canViewGates: true,
        canEditGates: false,
        canViewRoutes: true,
        canEditRoutes: false,
        canViewStats: true,
        canViewActivityLog: false,
        restrictedPages: [] // Supervisor can view all pages but with limited actions
    }
};

// Check if user has permission
function hasPermission(permission) {
    const userRole = sessionStorage.getItem('userRole');
    if (!userRole || !ROLE_PERMISSIONS[userRole]) {
        return false;
    }
    return ROLE_PERMISSIONS[userRole][permission] === true;
}

// Get current user's permissions
function getUserPermissions() {
    const userRole = sessionStorage.getItem('userRole');
    return ROLE_PERMISSIONS[userRole] || {};
}

// Apply role-based UI restrictions
function applyRoleRestrictions() {
    const userRole = sessionStorage.getItem('userRole');
    
    if (!userRole) {
        console.warn('No user role found!');
        return;
    }

    console.log('Applying restrictions for role:', userRole);

    // Hide/disable edit buttons for supervisors
    if (userRole === 'supervisor') {
        // Hide all delete buttons
        const deleteButtons = document.querySelectorAll('[data-action="delete"], .delete-btn, button[onclick*="delete"]');
        deleteButtons.forEach(btn => {
            btn.style.display = 'none';
        });

        // Disable all edit buttons
        const editButtons = document.querySelectorAll('[data-action="edit"], .edit-btn, button[onclick*="edit"], button[onclick*="update"]');
        editButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            btn.title = 'Supervisors cannot edit - Admin access required';
            
            // Prevent click events
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                showAccessDenied();
            }, true);
        });

        // Disable all add/create buttons
        const addButtons = document.querySelectorAll('[data-action="add"], .add-btn, button[onclick*="add"], button[onclick*="create"]');
        addButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            btn.title = 'Supervisors cannot add items - Admin access required';
            
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                showAccessDenied();
            }, true);
        });

        // Disable form inputs in edit mode
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            if (form.classList.contains('edit-form') || form.dataset.mode === 'edit') {
                const inputs = form.querySelectorAll('input:not([type="button"]):not([type="submit"]), textarea, select');
                inputs.forEach(input => {
                    input.disabled = true;
                });
            }
        });

        // Add visual indicator for read-only access
        addReadOnlyBanner();
    }
}

// Show access denied message
function showAccessDenied() {
    // Remove existing alert if any
    const existingAlert = document.querySelector('.access-denied-alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    const alert = document.createElement('div');
    alert.className = 'access-denied-alert';
    alert.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: #fee;
        color: #c33;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideInRight 0.3s ease-out;
    `;
    
    alert.innerHTML = `
        <i class="fas fa-exclamation-circle" style="font-size: 20px;"></i>
        <div>
            <strong>Access Denied</strong><br>
            <small>This action requires Admin privileges</small>
        </div>
    `;
    
    document.body.appendChild(alert);

    // Auto remove after 3 seconds
    setTimeout(() => {
        alert.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}

// Add read-only banner for supervisors
function addReadOnlyBanner() {
    const existingBanner = document.querySelector('.readonly-banner');
    if (existingBanner) return;

    const banner = document.createElement('div');
    banner.className = 'readonly-banner';
    banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #fef3c7;
        color: #92400e;
        padding: 8px 20px;
        text-align: center;
        font-size: 13px;
        z-index: 9999;
        border-bottom: 2px solid #fbbf24;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    `;
    
    banner.innerHTML = `
        <i class="fas fa-eye"></i>
        <strong>Supervisor Mode:</strong> You have read-only access. Contact admin for edit permissions.
    `;
    
    document.body.insertBefore(banner, document.body.firstChild);
}

// Log user action with permission check
function logUserAction(action, details) {
    const username = sessionStorage.getItem('username');
    const userRole = sessionStorage.getItem('userRole');
    
    if (!localStorage.getItem('activityLog')) {
        localStorage.setItem('activityLog', JSON.stringify([]));
    }
    
    const log = JSON.parse(localStorage.getItem('activityLog') || '[]');
    
    const activity = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        action: action,
        details: details,
        username: username,
        role: userRole,
        date: new Date().toLocaleString()
    };
    
    log.unshift(activity);
    
    if (log.length > 100) {
        log.pop();
    }
    
    localStorage.setItem('activityLog', JSON.stringify(log));
}

// Wrap any action with permission check
function performActionWithPermissionCheck(permission, action, actionName) {
    if (hasPermission(permission)) {
        action();
        logUserAction(actionName, `${actionName} performed successfully`);
        return true;
    } else {
        showAccessDenied();
        logUserAction('ACCESS_DENIED', `Attempted to ${actionName} without permission`);
        return false;
    }
}

// Initialize restrictions when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyRoleRestrictions);
} else {
    applyRoleRestrictions();
}

// Re-apply restrictions when content changes (for dynamic content)
const observer = new MutationObserver((mutations) => {
    // Debounce the restriction application
    clearTimeout(window.restrictionTimeout);
    window.restrictionTimeout = setTimeout(applyRoleRestrictions, 100);
});

// Start observing the content area
const contentArea = document.getElementById('content');
if (contentArea) {
    observer.observe(contentArea, {
        childList: true,
        subtree: true
    });
}

// Export functions for use in other scripts
window.hasPermission = hasPermission;
window.getUserPermissions = getUserPermissions;
window.showAccessDenied = showAccessDenied;
window.logUserAction = logUserAction;
window.performActionWithPermissionCheck = performActionWithPermissionCheck;
window.applyRoleRestrictions = applyRoleRestrictions;

console.log('✅ Role restrictions loaded successfully');