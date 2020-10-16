const puppeteer = require('puppeteer')

const Storage = require('./storage')

const APARTMENTS_PAGE = 'https://www.myhome.ge/en/s/Newly-finished-apartment-for-sale-Tbilisi?Keyword=Tbilisi&AdTypeID=1&PrTypeID=1&mapC=41.73188365%2C44.8368762993663&regions=687602533.687586034&districts=2172993612.671983000.5469869.5995653.2022621279&cities=1996871&GID=1996871&EstateTypeID=1.3&FPriceFrom=20000&FPriceTo=60000&FCurrencyID=1&AreaSizeFrom=40&FloorNums=notlast.notfirst&RoomNums=1.2.3&RenovationID=1.6'
const DEFAULT_DAYS_AGO = 2
const MS_IN_DAY = 86400000

const NEXT_PAGE_CLASS_NAME = 'step-forward'

const getApartments = () => {
  const APARTMENT_CLASS_NAME = 'statement-card'
  const PAGINATION_CLASS_NAME  = 'pagination-container'
  const CARD_RIGHT_INFO_CLASS_NAME = 'd-block'
  const AD_LABEL = 'vip-label'
  
  const [pagination] = document.getElementsByClassName(PAGINATION_CLASS_NAME)
  pagination.scrollIntoView()

  const apartmentsCards = [...document.getElementsByClassName(APARTMENT_CLASS_NAME)]
    .filter(card => !card.className.includes('banner'))

  const year = new Date().getFullYear()
  const apartments = apartmentsCards.map(card => {
    const [rawId, rawDate] = [...card.getElementsByClassName(CARD_RIGHT_INFO_CLASS_NAME)]
      .map(info => info.innerText)
    const [day, monthString, time] = rawDate.split(' ')
    const rawDateWithYear = [day, monthString, year, time].join(' ')
    const date = new Date(rawDateWithYear).getTime()
    const id = rawId.split(' ')[1]
    return ({
      url: card.children[0].href,
      id,
      date,
      ad: card.getElementsByClassName(AD_LABEL).length > 0
    })
  })

  return apartments
}

const wait = (ms = 1000) => new Promise(r => setTimeout(r, ms))

const getByClassName = (element, className) => {
  return element.$$(`.${className}`)
}

const findApartments = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-fullscreen']
  })
  const storage = new Storage('myhome-ge')
  let state = storage.get()
  const updateState = (newPart) => {
    state = { ...state, ...newPart }
    storage.update(state)
  }

  let apartmentsPage = await browser.newPage()
  await apartmentsPage.goto(APARTMENTS_PAGE)
  const now = Date.now()
  const lastVisitDate = state.lastVisitDate || now - MS_IN_DAY * DEFAULT_DAYS_AGO

  let apartments = await apartmentsPage.evaluate(getApartments)

  const getLastDate = () => [...apartments].reverse().find(a => !a.ad).date
  while (getLastDate() > lastVisitDate) {
    const [nextPage] = await getByClassName(apartmentsPage, NEXT_PAGE_CLASS_NAME)
    await nextPage.click()
    await wait()

    await apartmentsPage.reload({ waitUntil: "domcontentloaded" })
    await wait()

    const newApartments = await apartmentsPage.evaluate(getApartments)
    apartments.push(...newApartments)
  }

  const newApartments = apartments.filter(a => !state.shown.includes(a.id))
  
  for (const { url } of newApartments) {
    const page = await browser.newPage()
    await page.goto(url)
    wait()
  }

  updateState({
    lastVisitDate: now,
    shown: [...state.shown, ...newApartments.map(a => a.id)]
  })
  console.log(newApartments.map(a => a.url))
}

findApartments()