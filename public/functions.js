// firebase hosting 내 함수들을 모아놓은 곳 (firebase function 아님)

document.addEventListener('DOMContentLoaded', function() {
    var lang = navigator.language || navigator.userLanguage; // 기본값은 영어
    console.log(lang);
    change(lang);
});

function selectChange(e) {
    change(e.value);
}