$(function () {
    $('#search-form').find('.form-control').each(function (index, elem) {
        $(elem).focus(function () {
          $(elem).addClass('active');
          $(elem).prev().addClass('active');
        })
  
        $(elem).blur(function () {
          $(elem).removeClass('active');
          $(elem).prev().removeClass('active');
        })
    });
    
    $('#search-form label').click(function(e) {
        e.preventDefault();
    })

    $('#search').click(function() {
        console.log('button clicked');
    })

    
})