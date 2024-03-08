(() => {
    'use strict'

    document.querySelector('#navbarSideCollapse').addEventListener('click', () => {
        document.querySelector('.offcanvas-collapse').classList.toggle('open')
    })
})();
document.getElementById('togglePassword').addEventListener('click', function (e) {
    var passwordInput = document.getElementById('loginPwd');
    var togglePasswordIcon = document.getElementById('togglePasswordIcon');
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        togglePasswordIcon.classList.remove('bi-eye-slash'); // change the icon
        togglePasswordIcon.classList.add('bi-eye');
    } else {
        passwordInput.type = 'password';
        togglePasswordIcon.classList.remove('bi-eye'); // change the icon
        togglePasswordIcon.classList.add('bi-eye-slash');
    }
});
