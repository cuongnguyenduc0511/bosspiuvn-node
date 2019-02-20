$(document).ready(function() {
    const random = Math.floor(Math.random() * 7) + 1;
    const selectedHeader = `page-header--filter-${random}`;
    $("#page-header").addClass(selectedHeader);
});