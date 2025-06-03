const fs = require('fs')
const path = require('path')

const DATA_DIR = path.join(__dirname, '..', 'data')
const README_PATH = path.join(__dirname, '..', 'README.md')

const START_TAG = '<!-- PLACE_LIST_START -->'
const END_TAG = '<!-- PLACE_LIST_END -->'

function formatPlace(place) {
  const name = place.url
    ? `[**${place.name}**](${place.url})`
    : `**${place.name}**`

  let result = `- ${name} (${place.open_hours})\n`
  result += `  - 📍 ${place.address}\n`
  if (place.description) result += `  - 📝 ${place.description}\n`
  result += `  - 📶 와이파이: ${place.wifi} ｜ 🔌 콘센트: ${place.power} ｜ 💺 좌석: ${place.seat_count}\n`
  result += `  - 🚻 화장실: ${place.restroom}\n`
  if (place.images && place.images.length > 0) {
    result += `  - 🖼️ 이미지:\n`
    place.images.forEach((img, i) => {
      result += `    - ![이미지${i + 1}](${img})\n`
    })
  }
  return result
}

function generatePlaceSection() {
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'))

  let section = ''

  const now = new Date()
  const updatedAt = new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Seoul',
  }).format(now)

  section += `> 마지막 수정일: ${updatedAt}\n\n`

  for (const file of files) {
    const region = path.basename(file, '.json')
    const filePath = path.join(DATA_DIR, file)
    const raw = fs.readFileSync(filePath, 'utf-8')
    let places
    try {
      places = JSON.parse(raw)
    } catch (e) {
      console.error(`❌ JSON 파싱 오류: ${filePath}`)
      continue
    }

    section += `\n### ${region}\n`
    places.forEach((place) => {
      section += `${formatPlace(place)}\n`
    })
  }

  return section.trim()
}

function updateReadme() {
  const original = fs.readFileSync(README_PATH, 'utf-8')
  const section = generatePlaceSection()

  const newContent = original.replace(
    new RegExp(`${START_TAG}[\\s\\S]*?${END_TAG}`, 'm'),
    `${START_TAG}\n\n${section}\n\n${END_TAG}`
  )

  fs.writeFileSync(README_PATH, newContent)
  console.log('✅ README.md updated with place section!')
}

updateReadme()
