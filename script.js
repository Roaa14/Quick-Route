/**
 * script.js
 * Handles admin login, certificate creation/editing, student verification, and QR code generation.
 */

document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.querySelector('.login-btn');
    const createForm = document.getElementById('creation-form');
    
    const DEFAULT_USER = 'admin';       // Hardcoded admin username
    const DEFAULT_PASS = 'password123'; // Hardcoded admin password
    const CERT_STORAGE_KEY = 'quickroute_certificates'; // Key for all certificates

    // تم تغيير الثوابت لتمكين التوجيه باستخدام ./ (لضمان عمله على GitHub Pages)
    const INDEX_PAGE = 'index.html';
    const SYSTEM_PAGE = 'create_page.html';
    const MANAGEMENT_PAGE = 'certificate_management.html';
    const CERTIFICATE_PAGE = 'certificate_view.html';

    // --- Core Functions for Data Management ---

    /** Checks if an admin is currently logged in. */
    function checkLoginStatus() {
        return localStorage.getItem('isLoggedIn') === 'true';
    }

    /** Retrieves all certificates from localStorage. */
    function getAllCertificates() {
        return JSON.parse(localStorage.getItem(CERT_STORAGE_KEY) || '{}');
    }

    /** Saves or updates a certificate object to localStorage. */
    function saveCertificate(certData) {
        const allCerts = getAllCertificates();
        // The studentUsername is the unique key
        allCerts[certData.studentUsername] = certData;
        localStorage.setItem(CERT_STORAGE_KEY, JSON.stringify(allCerts));
    }
    
    /** Deletes a certificate by student username. */
    window.deleteCertificate = function(username) {
        if (!confirm(`هل أنت متأكد من حذف شهادة المستخدم: ${username}؟`)) {
            return;
        }
        const allCerts = getAllCertificates();
        delete allCerts[username];
        localStorage.setItem(CERT_STORAGE_KEY, JSON.stringify(allCerts));
        alert('تم حذف الشهادة بنجاح.');
        // Re-render the list after deletion
        if (window.location.pathname.endsWith(MANAGEMENT_PAGE)) {
            renderCertificateList();
        }
    }

    /** Redirects to the creation page with certificate data for editing. */
    window.editCertificate = function(username) {
        // تم تصحيح المسار
        window.location.href = `./${SYSTEM_PAGE}?edit=${username}`;
    }

    /** Looks up a certificate by student username and verifies the password. */
    function lookupCertificate(username, password) {
        const allCerts = getAllCertificates();
        const cert = allCerts[username];

        if (cert && cert.studentPassword === password) {
            return cert;
        }
        return null;
    }

    /** Displays the "No certificate" message on the view page. */
    function displayNoCertificate() {
        const container = document.querySelector('.certificate-container');
        if (container) {
            container.innerHTML = `
                <h1 style="color: #ff4545;">لا توجد شهادة</h1>
                <p style="font-size: 20px; color: #555;">الرجاء التأكد من صحة بيانات التحقق.</p>
                <button class="logout-btn btn" style="margin-top: 40px;" onclick="window.location.href='./certificate_lookup.html';">العودة لصفحة البحث</button>
            `;
        }
    }

    /** Generates a simulated QR code image element using a public API. */
    function generateQRCode(data) {
        const imageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(data)}`;
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = "QR Code for Verification";
        return img;
    }

    /** Redirects admin pages based on login status. */
    function redirectIfNecessary() {
        const path = window.location.pathname;
        const isLoginPage = path.endsWith(INDEX_PAGE) || path.endsWith('/');
        const isProtectedPage = path.endsWith(SYSTEM_PAGE) || path.endsWith(MANAGEMENT_PAGE);

        if (checkLoginStatus() && isLoginPage) {
            // تم تصحيح المسار
            window.location.href = './' + SYSTEM_PAGE; 
        } else if (!checkLoginStatus() && isProtectedPage) {
            if (path.endsWith(SYSTEM_PAGE) || path.endsWith(MANAGEMENT_PAGE)) {
                // تم تصحيح المسار
                window.location.href = './' + INDEX_PAGE;
            }
        }
    }
    
    // --- Management Page Renderer ---

    function renderCertificateList() {
        const certs = getAllCertificates();
        const listBody = document.getElementById('certificate-list-body');
        if (!listBody) return;

        listBody.innerHTML = '';
        const certArray = Object.values(certs);

        if (certArray.length === 0) {
            listBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #ccc;">لا توجد شهادات مسجلة بعد.</td></tr>';
            return;
        }

        certArray.forEach(cert => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${cert.recipient}</td>
                <td>${cert.title}</td>
                <td>${cert.studentUsername}</td>
                <td>${cert.date}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="editCertificate('${cert.studentUsername}')">تعديل</button>
                    <button class="action-btn delete-btn" onclick="deleteCertificate('${cert.studentUsername}')">حذف</button>
                </td>
            `;
            listBody.appendChild(row);
        });
    }


    // --- Initialization and Event Handling ---
    
    // 1. Admin Login Page Logic (index.html)
    if (loginButton && window.location.pathname.endsWith(INDEX_PAGE)) {
        loginButton.addEventListener('click', () => {
            const usernameInput = document.querySelectorAll('input')[0];
            const passwordInput = document.querySelectorAll('input')[1];

            if (usernameInput.value === DEFAULT_USER && passwordInput.value === DEFAULT_PASS) {
                localStorage.setItem('isLoggedIn', 'true');
                alert('تم تسجيل الدخول بنجاح! (الحساب الإداري)');
                // تم تصحيح المسار
                window.location.href = './' + SYSTEM_PAGE;
            } else {
                alert('خطأ في اسم المستخدم أو كلمة المرور.');
            }
        });
    }

    // 2. Certificate Creation/Editing Logic (create_page.html)
    if (createForm) {
        const urlParams = new URLSearchParams(window.location.search);
        const editKey = urlParams.get('edit');
        const formTitle = document.querySelector('.container h2');
        let currentOriginalUsername = null; 

        if (editKey) {
            const certData = getAllCertificates()[editKey];
            if (certData) {
                // Populate form for editing
                formTitle.textContent = 'تعديل بيانات الشهادة';
                document.getElementById('cert-title-input').value = certData.title;
                document.getElementById('cert-recipient-input').value = certData.recipient;
                document.getElementById('cert-degree-input').value = certData.degree;
                document.getElementById('cert-issuer-input').value = certData.issuer;
                document.getElementById('cert-date-input').value = certData.date;
                document.getElementById('cert-username-input').value = certData.studentUsername;
                document.getElementById('cert-password-input').value = certData.studentPassword;
                
                currentOriginalUsername = certData.studentUsername; 
                
                document.getElementById('create-submit-btn').textContent = 'حفظ التعديلات';
            }
        }
        
        createForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Collect all data
            const title = document.getElementById('cert-title-input').value;
            const recipient = document.getElementById('cert-recipient-input').value;
            const degree = document.getElementById('cert-degree-input').value;
            const issuer = document.getElementById('cert-issuer-input').value;
            const date = document.getElementById('cert-date-input').value;
            const studentUsername = document.getElementById('cert-username-input').value;
            const studentPassword = document.getElementById('cert-password-input').value;

            if (!title || !recipient || !issuer || !date || !studentUsername || !studentPassword) {
                alert('الرجاء إدخال جميع البيانات الأساسية وبيانات التحقق الخاصة بالطالب.');
                return;
            }

            const certData = {
                title: title,
                recipient: recipient,
                degree: degree || 'غير محدد',
                issuer: issuer,
                date: date,
                studentUsername: studentUsername,
                studentPassword: studentPassword 
            };

            // If we are editing and the username has changed, delete the old entry first
            if (editKey && currentOriginalUsername && currentOriginalUsername !== studentUsername) {
                // We use the direct delete function (not the window version) to avoid alert/confirm
                const allCerts = getAllCertificates();
                delete allCerts[currentOriginalUsername];
                localStorage.setItem(CERT_STORAGE_KEY, JSON.stringify(allCerts));
            }

            saveCertificate(certData); // Save (or update) the certificate
            alert(`تم حفظ البيانات بنجاح للمستخدم: ${studentUsername}`);
            // تم تصحيح المسار
            window.location.href = './' + MANAGEMENT_PAGE; // Redirect to management view after save
        });
    }
    
    // 3. Certificate Management Logic (certificate_management.html)
    if (window.location.pathname.endsWith(MANAGEMENT_PAGE)) {
        renderCertificateList();
    }

    // 4. Student Certificate Lookup Logic (certificate_lookup.html)
    if (window.location.pathname.endsWith('certificate_lookup.html')) {
        const lookupForm = document.getElementById('lookup-form');
        if (lookupForm) {
            lookupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const username = document.getElementById('student-username').value;
                const password = document.getElementById('student-password').value;

                const cert = lookupCertificate(username, password);

                if (cert) {
                    // تم تصحيح المسار
                    window.location.href = `./${CERTIFICATE_PAGE}?key=${username}`;
                } else {
                    alert('خطأ في اسم المستخدم أو كلمة المرور أو لا توجد شهادة مسجلة بهذا الاسم.');
                }
            });
        }
    }

    // 5. Certificate View Logic (certificate_view.html)
    if (window.location.pathname.endsWith(CERTIFICATE_PAGE)) {
        const urlParams = new URLSearchParams(window.location.search);
        const certKey = urlParams.get('key'); 

        if (!certKey) {
            displayNoCertificate();
            return;
        }
        
        const certData = getAllCertificates()[certKey];

        if (certData) {
            // Update the certificate display
            document.getElementById('cert-title').textContent = certData.title;
            document.getElementById('cert-recipient').textContent = certData.recipient;
            document.getElementById('cert-degree').textContent = certData.degree;
            document.getElementById('cert-issuer').textContent = certData.issuer;
            document.getElementById('cert-date').textContent = certData.date;

            // Concatenate data for the QR code
            const qrData = `QuickRoute Verification:\nTitle: ${certData.title}\nRecipient: ${certData.recipient}\nIssuer: ${certData.issuer}\nDate: ${certData.date}\nStudent Username: ${certData.studentUsername}`;

            // Generate and display the QR code
            const qrDisplay = document.getElementById('qr-code-display');
            qrDisplay.innerHTML = ''; 
            const qrImage = generateQRCode(qrData);
            qrDisplay.appendChild(qrImage);
        } else {
            displayNoCertificate();
        }
    }
    
    // 6. Logout Logic
    const logoutButton = document.querySelector('.logout-btn');
    if (logoutButton) {
        // تم تغيير الحدث لزر تسجيل الخروج في الصفحات الإدارية
        if (window.location.pathname.endsWith(SYSTEM_PAGE) || window.location.pathname.endsWith(MANAGEMENT_PAGE)) {
             logoutButton.addEventListener('click', () => {
                localStorage.removeItem('isLoggedIn');
                alert('تم تسجيل الخروج.');
                // تم تصحيح المسار
                window.location.href = './' + INDEX_PAGE; 
            });
        }
        // ملاحظة: زر "البحث عن شهادة أخرى" في certificate_view يستخدم 'window.location.href' مباشرة في HTML.
    }

    // Initial admin check for protected pages
    redirectIfNecessary();
});
