// jsdom belum mengimplementasikan scrollTo; vue-router memanggilnya lewat scrollBehavior.
window.scrollTo = () => {};
