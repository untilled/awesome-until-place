const fs = require('fs')
const path = require('path')

const DATA_DIR = path.join(__dirname, '..', 'data')
const README_PATH = path.join(__dirname, '..', 'README.md')

const START_TAG = '<!-- PLACE_LIST_START -->'
const END_TAG = '<!-- PLACE_LIST_END -->'

function formatPlace(place) {
  return `- **${place.name}**  
  주소: ${place.address}  
  와이파이: ${place.wifi} ｜ 콘센트: ${place.power} ｜ 좌석: ${
    place.seat_count
  } ｜ 조용함: ${place.quiet ? '✅' : '❌'}  
  [링크](${place.url || '#'})`
}

function generatePlaceSection() {
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'))

  let section = ''

  for (const file of files) {
    const region = path.basename(file, '.json')
    const filePath = path.join(DATA_DIR, file)
    const places = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

    section += `\n### ${region}\n`
    places.forEach((place) => {
      section += `${formatPlace(place)}\n\n`
    })
  }

  return section.trim()
}

function updateReadme() {
  const original = fs.readFileSync(README_PATH, 'utf-8')
  const section = generatePlaceSection()

  const [before, , after] = original.split(
    new RegExp(`${START_TAG}[\\s\\S]*?${END_TAG}`, 'm')
  )

  const newContent = `${before}${START_TAG}\n${section}\n${END_TAG}${after}`
  fs.writeFileSync(README_PATH, newContent)
  console.log('✅ README.md updated with place section!')
}

updateReadme()
