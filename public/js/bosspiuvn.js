window.onscroll = function() {scrollFunction()};

function scrollFunction() {
  if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
    document.getElementById("scrollToTop").style.display = "block";
  } else {
    document.getElementById("scrollToTop").style.display = "none";
  }
}

// When the user clicks on the button, scroll to the top of the document
function goToTop() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}

// function openNav() {
//   $('#navbar-overlay').removeClass('close').addClass('open');
// }

// function closeNav() {
//   $('#navbar-overlay').removeClass('open').addClass('close').one('webkitAnimationEnd mozAnimationEnd oAnimationEnd msAnimationEnd animationend', 
//     function() {
//       var elem = $(this);
//       elem.removeClass('close');
//     }
//   );
// }

// $('#navbar-collapse').click(function() {
//   openNav();
// })  
