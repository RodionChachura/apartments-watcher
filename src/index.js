const puppeteer = require('puppeteer')

const APARTMENTS_PAGE = 'https://www.myhome.ge/en/s/Newly-finished-apartment-for-sale-Tbilisi?Keyword=Tbilisi&AdTypeID=1&PrTypeID=1&mapC=41.73188365%2C44.8368762993663&regions=687602533.687586034&districts=2172993612.671983000.5469869.5995653.2022621279&cities=1996871&GID=1996871&EstateTypeID=1.3&FPriceFrom=20000&FPriceTo=60000&FCurrencyID=1&AreaSizeFrom=40&FloorNums=notlast.notfirst&RoomNums=1.2.3&RenovationID=1.6'


const findApartments = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-fullscreen']
  })
  const apartmentsPage = await browser.newPage()
  await apartmentsPage.goto(APARTMENTS_PAGE)
  const apartments = await apartmentsPage.evaluate(() => {
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

    const lastDate = [...apartments].reverse().find(a => !a.ad).date
    console.log(lastDate)
    return apartments
  })
  console.log(apartments)
}

findApartments()