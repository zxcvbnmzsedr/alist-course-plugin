import { defineConfig, presetUno, presetAttributify, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons()
  ],
  shortcuts: {
    'flex-center': 'flex justify-center items-center',
    'flex-between': 'flex justify-between items-center',
  }
})
