const fs = require('fs')
const path = require('path')
const https = require('https')

/**
 * Kakao Local API를 사용하여 주소로부터 좌표를 가져옵니다.
 * @param {string} address - 주소
 * @returns {Promise<{lat: number, lng: number}>}
 */
async function getCoordinatesFromAddress(address) {
  const kakaoApiKey = process.env.KAKAO_API_KEY

  if (!kakaoApiKey) {
    throw new Error('KAKAO_API_KEY environment variable is required')
  }

  return new Promise((resolve, reject) => {
    const encodedAddress = encodeURIComponent(address)
    const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodedAddress}`

    const options = {
      headers: {
        Authorization: `KakaoAK ${kakaoApiKey}`,
      },
    }

    https
      .get(url, options, (res) => {
        let data = ''

        res.on('data', (chunk) => {
          data += chunk
        })

        res.on('end', () => {
          try {
            console.log('api success')

            console.log(data)

            const json = JSON.parse(data)

            if (json.documents && json.documents.length > 0) {
              const result = json.documents[0]
              resolve({
                lat: parseFloat(result.y),
                lng: parseFloat(result.x),
              })
            } else {
              reject(new Error(`No coordinates found for address: ${address}`))
            }
          } catch (error) {
            reject(error)
          }
        })
      })
      .on('error', (error) => {
        reject(error)
      })
  })
}

/**
 * JSON 파일의 모든 장소에 대해 좌표를 채웁니다.
 * @param {string} filePath - JSON 파일 경로
 */
async function fillCoordinates(filePath) {
  console.log(`Processing ${filePath}...`)

  const content = fs.readFileSync(filePath, 'utf8')
  const places = JSON.parse(content)

  let updated = false

  for (let i = 0; i < places.length; i++) {
    const place = places[i]

    // lat 또는 lng가 없는 경우에만 좌표를 가져옵니다
    if (!place.lat || !place.lng) {
      console.log(`  → [${i}] ${place.name}: Fetching coordinates...`)

      try {
        const coordinates = await getCoordinatesFromAddress(place.address)
        place.lat = coordinates.lat
        place.lng = coordinates.lng
        updated = true
        console.log(
          `    ✓ Added: lat=${coordinates.lat}, lng=${coordinates.lng}`
        )

        // API 호출 제한을 피하기 위해 잠시 대기
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`    ✗ Error: ${error.message}`)
      }
    } else {
      console.log(`  → [${i}] ${place.name}: Coordinates already exist`)
    }
  }

  if (updated) {
    fs.writeFileSync(filePath, JSON.stringify(places, null, 2) + '\n', 'utf8')
    console.log(`✓ Updated ${filePath}`)
    return true
  } else {
    console.log(`○ No changes needed for ${filePath}`)
    return false
  }
}

/**
 * data 디렉토리의 모든 JSON 파일을 처리합니다.
 */
async function main() {
  const dataDir = path.join(__dirname, '../data')
  const files = fs.readdirSync(dataDir).filter((file) => file.endsWith('.json'))

  console.log(`Found ${files.length} JSON file(s) in data/\n`)

  let anyUpdated = false

  for (const file of files) {
    const filePath = path.join(dataDir, file)
    try {
      const wasUpdated = await fillCoordinates(filePath)
      anyUpdated = anyUpdated || wasUpdated
      console.log('')
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message)
      process.exit(1)
    }
  }

  if (anyUpdated) {
    console.log('✓ Coordinates have been filled successfully!')
  } else {
    console.log('○ All coordinates are already filled.')
  }
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
