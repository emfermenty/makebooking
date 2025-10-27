import { renderSchedule } from './admin-pages/schedule.js';
import { renderOpenBooking } from './admin-pages/open-booking.js';
import { renderManagement } from './admin-pages/management.js';

const content = document.getElementById('content');
const navButtons = document.querySelectorAll('.bottom-nav button');

const pages = {
  'schedule': renderSchedule,
  'open-booking': renderOpenBooking,
  'management': renderManagement
};

function navigate(page) {
  navButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.page === page));
  pages[page](content);
}

navButtons.forEach(btn => btn.addEventListener('click', () => navigate(btn.dataset.page)));

navigate('schedule'); // стартовая страница