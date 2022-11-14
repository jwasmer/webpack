import User from './classes/user.js'
import Booking from './classes/Booking';
import './css/styles.css';
import './images/stanley-hotel-with-mountains.png';
import './images/stanley-sky.png';
import './images/deluxe-suite.png';
import './images/lodge-suite.png';
import './images/double-bed.png';
import './images/regular-room.png';
import './images/overlook-logo.png';

import flatpickr from 'flatpickr';

import { fetchAll, postBooking } from './apiCalls';

// ********** Initialize App **********

// *** Global Variables ***
let store = {
  usersData: null,
  bookingsData: null,
  roomsData: null,
  currentUser: null,
  search: {
    bookingDate: null,
    roomFilter: null,
    results: null,
    vacantRooms: [],
  },
  selectedBooking: null,
}

// *** API calls ***
fetchAll()
  .then((data) => {
    store.usersData = data.usersData.customers
    store.bookingsData = data.bookingsData.bookings
    store.roomsData = data.roomsData.rooms
    store.currentUser = new User(store.usersData[0])
  })
  .then(() => {
    buildBookingInstances(store.bookingsData)
    buildBookingsMenu(store.currentUser, store.bookingsData, store.roomsData)
  })

// ********** Element Assignments **********
const bookingsMenu = document.querySelector('.bookings-menu')
const bookingsDropdown = document.querySelector('.bookings-dropdown')
const buttons = document.querySelectorAll('button')
const viewBookings = document.getElementById('view-bookings')
const findRoomsBtn = document.getElementById('find-rooms-btn')
const calendarInput = document.getElementById('calendar-input')
const singleRoomCard = document.getElementById('single-room-card')
const juniorSuiteCard = document.getElementById('junior-suite-card')
const residentialSuiteCard = document.getElementById('residential-suite-card')
const suiteCard = document.getElementById('suite-card')
const searchError = document.getElementById('search-error')
const singleRoomInfo = document.getElementById('single-room-info')
const juniorRoomInfo = document.getElementById('junior-room-info')
const residentialRoomInfo = document.getElementById('residential-room-info')
const suiteRoomInfo = document.getElementById('suite-room-info')
const roomCardInfo = document.querySelectorAll('.room-card--info')
const roomCardBookBtn = document.querySelectorAll('.room-card--book-btn')

// ********** Event Listeners **********
bookingsMenu.addEventListener('click', toggleMenu)
findRoomsBtn.addEventListener('click', getAllVacancies)

buttons.forEach((button) => {
  button.addEventListener('click', function(e) {
    event.preventDefault()
  })
})

roomCardBookBtn.forEach((button) => {
  button.addEventListener('click', bookRoom)
})

roomCardInfo.forEach((container) => {
  container.addEventListener('click', function(e) {

    const buttonRoomType = e.target.dataset.roomType

    if (e.target.classList.contains('room-card--data') && store.selectedBooking !== e.target.id) {
      clearSelectedBooking()
      store.selectedBooking = e.target.id
      e.target.style.backgroundColor = '#ece1d1'

      roomCardBookBtn.forEach((button) => {
        if (buttonRoomType === button.dataset.roomType) {
          button.disabled = false
          button.innerText = "Book Now"
        }
      })
    } else if (store.selectedBooking === e.target.id) {
      clearSelectedBooking()
    } 
  })
})

function bookRoom() {
  const id = Number(store.currentUser.id)
  const date = store.search.bookingDate.toISOString().split('T')[0].replaceAll('-', '/')
  const roomNumber = Number(store.selectedBooking)

  postBooking(id, date, roomNumber)
  confirmBooking(date, roomNumber)
}

function confirmBooking(date, roomNumber) {
  document.querySelector('aside').classList.remove('hidden')
  document.querySelector('aside').innerHTML = `<p>Booking confirmed for Room ${roomNumber} on ${date}!`
}

function clearSelectedBooking() {
  resetBookingButtons()

  if (store.selectedBooking) {
    document.getElementById(store.selectedBooking).style.backgroundColor = 'white'
    store.selectedBooking = null;
  }
}

function resetBookingButtons() {
  roomCardBookBtn.forEach((button) => {
    if (button.classList.contains('room-card--book-btn')) {
      button.disabled = true
      button.innerText = 'Select Room'
    }
  })
}


// ********** Flatpickr Calendar **********
flatpickr(calendarInput, {
  enableTime: false,
  altInput: true,
  altFormat: "F J, Y",
  mode: "single",
  minDate: "today",
  onChange: function(selectedDates) {
    if (selectedDates.length === 0) {
      findRoomsBtn.innerText = 'Find Available Rooms'
      store.search.bookingDate = null;
    } else {
      findRoomsBtn.innerText = 'Click to Search'
      store.search.bookingDate = new Date(selectedDates)
    }
  }
});

function getAllVacancies() {
  if (store.selectedBooking) {
    clearSelectedBooking()
  }
  if (store.search.bookingDate) {
    hideRoomCards()
    clearOldData()
    roomSearch()
    removeBookedRooms()
    sortRoomType()
    updateSearchButtonText()
  }
}

function roomSearch() {
  store.search.results = store.currentUser.getVacancies(store.bookingsData, store.search.bookingDate)
}

function removeBookedRooms() {
  store.roomsData.forEach(room => {
    const isBooked = store.search.results.some(result => {
      return result.roomNum === room.number
    })
    if (!isBooked) {
      store.search.vacantRooms.push(room)
    }
  })
}

function sortRoomType() {
  const roomTypeFilter = document.getElementById('room-type-dropdown').value
  if (roomTypeFilter) {
    sortRoomTypeFiltered(roomTypeFilter)
  }
  else {
    sortRoomTypeUnfiltered()
  }
}

function sortRoomTypeUnfiltered() {
  if (store.search.results.length === 0) {
    searchError.classList.remove('hidden')
  }

  store.search.vacantRooms.forEach(vacancy => {
    const bedSize = vacancy.bedSize.charAt(0).toUpperCase() + vacancy.bedSize.slice(1)
    const bidet = () => {
      if (vacancy.bidet) {
        return 'has bidet'
      } else {
        return 'no bidet'
      }
    }
    sortIntoSingleRoom(vacancy, bedSize, bidet)
    sortIntoJuniorSuite(vacancy, bedSize, bidet)
    sortIntoResidentialSuite(vacancy, bedSize, bidet)
    sortIntoSuite(vacancy, bedSize, bidet)
  })
}

function sortIntoSingleRoom(vacancy, bedSize, bidet) {
  if (vacancy.roomType === 'single room') {
    singleRoomInfo.innerHTML += `<p class="room-card--data" id="${vacancy.number}" data-room-type="single-room"> Room ${vacancy.number}: ${vacancy.numBeds} ${bedSize} bed(s), ${bidet()}. ${vacancy.costPerNight} per night. </p>`

    singleRoomCard.classList.remove('hidden')
  }
}

function sortIntoJuniorSuite(vacancy, bedSize, bidet) {
  if (vacancy.roomType === 'junior suite') {
    juniorRoomInfo.innerHTML += `<p class="room-card--data" id="${vacancy.number}" data-room-type="junior-room"> Room ${vacancy.number}: ${vacancy.numBeds} ${bedSize} bed(s), ${bidet()}. ${vacancy.costPerNight} per night. </p>`

    juniorSuiteCard.classList.remove('hidden')
  }
}

function sortIntoResidentialSuite(vacancy, bedSize, bidet) {
  if (vacancy.roomType === 'residential suite') {
    residentialRoomInfo.innerHTML += `<p class="room-card--data" id="${vacancy.number}" data-room-type="residential-room"> Room ${vacancy.number}: ${vacancy.numBeds} ${bedSize} bed(s), ${bidet()}. ${vacancy.costPerNight} per night. </p>`

    residentialSuiteCard.classList.remove('hidden')
  }
}

function sortIntoSuite(vacancy, bedSize, bidet) {
  if (vacancy.roomType === 'suite') {
    suiteRoomInfo.innerHTML += `<p class="room-card--data" id="${vacancy.number}" data-room-type="suite-room"> Room ${vacancy.number}: ${vacancy.numBeds} ${bedSize} bed(s), ${bidet()}. ${vacancy.costPerNight} per night. </p>`

    suiteCard.classList.remove('hidden')
  }
}

function sortRoomTypeFiltered(filter) {
  const filteredVacancies = store.search.vacantRooms.filter(vacancy => {
    return vacancy.roomType === filter
  })

  store.search.vacantRooms = filteredVacancies
  sortRoomTypeUnfiltered()
}

function updateSearchButtonText() {
  if (store.search.vacantRooms.length >= 0) {
    findRoomsBtn.innerText = `${store.search.vacantRooms.length} Vacancies Found!`
  }
  else {
    findRoomsBtn.innerText = `Sold Out`
  }
}

function hideRoomCards() {
  singleRoomCard.classList.add('hidden')
  juniorSuiteCard.classList.add('hidden')
  residentialSuiteCard.classList.add('hidden')
  suiteCard.classList.add('hidden')
  searchError.classList.add('hidden')
}

function clearOldData() {
  singleRoomInfo.innerHTML = ''
  juniorRoomInfo.innerHTML = ''
  residentialRoomInfo.innerHTML = ''
  suiteRoomInfo.innerHTML = ''
  findRoomsBtn.innerText = 'Find Available Rooms'

  store.search.vacantRooms = []
}

// ********** View Bookings **********
function toggleMenu() {
  if (bookingsDropdown.style.opacity === "0") {
    bookingsDropdown.style.opacity = ".90"
    bookingsDropdown.style.pointerEvents = "all"
  } else {
    bookingsDropdown.style.opacity = "0"
    bookingsDropdown.style.pointerEvents = "none"
  }
}

function buildBookingsMenu(user, bookingsData, roomsData) {
  const userBookings = user.findAllBookings(bookingsData)
  let totalPrice = 0

  userBookings.forEach(booking => {
    const room = booking.findRoomData(roomsData)
    totalPrice += room.costPerNight
    viewBookings.innerHTML += `<p class="menu--booking"> Date: ${booking.date}, Room: ${room.roomType} #${room.number}, Price: $${room.costPerNight}</p>`
  })
  viewBookings.innerHTML += `<p class="menu--booking"> Total Price: $${Math.round(totalPrice * 100)/100} </p>`
}

function buildBookingInstances(data) {
  store.bookingsData = data.map(booking => {
    return new Booking(booking)
  })
}

export { store };