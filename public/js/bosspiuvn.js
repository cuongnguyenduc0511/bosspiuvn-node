$(document).ready(() => {
    // setTimeout(function() {
    //     $("html, body").animate({ scrollTop: 0 }, 300);
    //     toggleNavbar();
    // })

    $("#sidebar").mCustomScrollbar({
        theme: "minimal"
    });

    $('#dismiss, .overlay').on('click', function () {
        $('#sidebar').removeClass('active');
        $('.overlay').removeClass('active');
    });

    $('#sidebarCollapse').on('click', function () {
        $('#sidebar').addClass('active');
        $('.overlay').addClass('active');
        $('.collapse.in').toggleClass('in');
        $('a[aria-expanded=true]').attr('aria-expanded', 'false');
    });

});

// $( window ).scroll(() => {
//     toggleNavbar();
// });

// function toggleNavbar() {
//     let navbarElem = $('.navbar').first();
//     let pageHeaderElem = $('.page-header').first();
//     let changeOffset = pageHeaderElem.hasClass('page-header__background') ? 70 : 150;
//     if(window.pageYOffset > changeOffset) {
//         navbarElem.removeClass( "navbar-transparent" );
//     } else {
//         navbarElem.addClass( "navbar-transparent" );
//     }
// }