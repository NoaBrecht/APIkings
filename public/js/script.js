(() => {
    const navbarSideCollapse = document.querySelector('#navbarSideCollapse');
    const offcanvasCollapse = document.querySelector('.offcanvas-collapse');
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
    if (navbarSideCollapse && offcanvasCollapse) {
        navbarSideCollapse.addEventListener('click', () => {
            offcanvasCollapse.classList.toggle('open')
        });
    }// Display a warning message in the console
    console.log("%cStop!", "color: red; font-size: 24px; font-weight: bold");
    console.log("%cIf someone told you to copy/paste something here, it is likely a scam and will give them access to your account.", "font-size: 16px;");
    console.log("%cUnless you understand exactly what you are doing, close this window immediately.", "font-size: 16px;");
})()

var togglePassword = document.getElementById('togglePassword');
var passwordInput = document.getElementById('loginPwd');
var togglePasswordIcon = document.getElementById('togglePasswordIcon');
if (togglePassword && passwordInput && togglePasswordIcon) {
    togglePassword.addEventListener('click', function (e) {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            togglePasswordIcon.classList.remove('bi-eye-slash');
            togglePasswordIcon.classList.add('bi-eye');
        } else {
            passwordInput.type = 'password';
            togglePasswordIcon.classList.remove('bi-eye');
            togglePasswordIcon.classList.add('bi-eye-slash');
        }
    });
}
