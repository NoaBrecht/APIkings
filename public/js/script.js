(() => {
    const navbarSideCollapse = document.querySelector('#navbarSideCollapse');
    const offcanvasCollapse = document.querySelector('.offcanvas-collapse');
    if (navbarSideCollapse && offcanvasCollapse) {
        navbarSideCollapse.addEventListener('click', () => {
            offcanvasCollapse.classList.toggle('open')
        });
    }
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