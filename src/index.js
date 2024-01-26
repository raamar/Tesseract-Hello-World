/**
 * @typedef {import('./index.d.ts')}
 */

document.addEventListener('DOMContentLoaded', async () => {
  const worker = await Tesseract.createWorker('eng')
  await worker.setParameters({
    tessedit_char_whitelist: '0123456789',
  })

  const list_mock = [
    {
      id: '1',
      name: 'Мотор',
      code: '001234',
    },
    {
      id: '2',
      name: 'Щетка',
      code: '002345',
    },
    {
      id: '3',
      name: 'Фильтр',
      code: '003456',
    },
    {
      id: '4',
      name: 'Шланг',
      code: '004567',
    },
    {
      id: '5',
      name: 'Корпус',
      code: '005678',
    },
    {
      id: '6',
      name: 'Насадка для ковров',
      code: '006789',
    },
    {
      id: '7',
      name: 'Ручка',
      code: '007890',
    },
    {
      id: '8',
      name: 'Колесо',
      code: '008901',
    },
    {
      id: '9',
      name: 'Пылесборник',
      code: '009012',
    },
    {
      id: '10',
      name: 'Провод',
      code: '010123',
    },
    {
      id: '11',
      name: 'Выключатель',
      code: '011234',
    },
    {
      id: '12',
      name: 'Турбощетка',
      code: '012345',
    },
    {
      id: '13',
      name: 'Трубка',
      code: '013456',
    },
    {
      id: '14',
      name: 'Плата управления',
      code: '014567',
    },
    {
      id: '15',
      name: 'Щелевая насадка',
      code: '015678',
    },
    {
      id: '16',
      name: 'Ремень привода',
      code: '016789',
    },
  ]

  const box_size = 40

  /** @type {HTMLElement} */
  const app_container = document.querySelector('.container')
  const original_img = document.querySelector('img')
  const list_container = document.querySelector('.list')
  const popup_container = app_container.querySelector('.popup')

  const hover_id = (() => {
    let current = ''

    return {
      change(value) {
        value = value.split('\n').at(0)
        if (current === value) {
          return
        }
        current = value
        app_container.dispatchEvent(new CustomEvent('hover_id_changed', { detail: value }))
      },
    }
  })()

  const id_img = ((src) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    let base64 = ''

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      canvas.getContext('2d').drawImage(img, 0, 0)
      base64 = canvas.toDataURL('image/png', 1.0)
    }

    img.src = src

    return {
      get width() {
        return img.width
      },

      get height() {
        return img.height
      },

      get base64() {
        return base64
      },
    }
  })(original_img.dataset.src_id)

  /**
   * @type {(x: number, y: number) => void}
   */
  const recognize = _.throttle((x, y) => {
    if (!id_img.base64) return
    worker
      .recognize(id_img.base64, {
        rectangle: {
          left: ((x - box_size / 2) * id_img.width) / original_img.width,
          top: ((y - box_size / 2) * id_img.height) / original_img.height,
          width: (box_size * id_img.width) / original_img.width,
          height: (box_size * id_img.width) / original_img.width,
        },
      })
      .then((result) => {
        hover_id.change(result.data.text)
      })
  }, 250)

  /**
   * @param {MouseEvent} event
   */
  const handle_mouse_move = (event) => {
    app_container.style.setProperty('--mx', event.offsetX + 'px')
    app_container.style.setProperty('--my', event.offsetY + 'px')

    recognize(event.offsetX, event.offsetY)
  }

  /**
   * @param {{detail: string}} event
   */
  const handle_hover_id_changed = (event) => {
    const { detail: id } = event

    popup_container.classList.toggle('show', !!id)
    list_container.querySelectorAll('li').forEach((item) => item.classList.remove('hover'))

    if (!id) return

    const item = list_mock.find((item) => item.id === id)

    if (!item) return

    const list_item = list_container.querySelector(`[data-id="${item.id}"]`)

    if (!list_item) {
      return
    }

    list_item.classList.add('hover')
    list_item.scrollIntoView({ block: 'center', behavior: 'smooth' })

    popup_container.querySelector('header').innerHTML =
      'ID: ' + `<strong>${id}</strong>` + '<br>Артикул: ' + `<strong>${item.code}</strong>`
    popup_container.querySelector('section').innerHTML = 'Название: ' + `<strong>${item.name}</strong>`
  }

  const addEventListeners = () => {
    app_container.addEventListener('mousemove', handle_mouse_move)
    app_container.addEventListener('hover_id_changed', handle_hover_id_changed)
  }

  const removeEventListeners = () => {
    app_container.removeEventListener('mousemove', handle_mouse_move)
    app_container.removeEventListener('hover_id_changed', handle_hover_id_changed)
  }

  const init = () => {
    list_container.innerHTML = list_mock
      .map(
        ({ id, name, code }) =>
          `<li data-id="${id}">` +
          '<header>' +
          'ID: ' +
          `<strong>${id}</strong>` +
          '<br>Артикул: ' +
          `<strong>${code}</strong>` +
          '</header>' +
          '<section>' +
          'Название: ' +
          `<strong>${name}</strong>` +
          '</section>' +
          '<hr>' +
          `</li>`
      )
      .join('\n')

    app_container.style.setProperty('--box_size', box_size + 'px')

    addEventListeners()

    return {
      removeEventListeners,
    }
  }

  init()

  return {
    removeEventListeners,
  }
})
