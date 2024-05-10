import { defineUserConfig } from 'vuepress'
import { viteBundler } from '@vuepress/bundler-vite'
import { plumeTheme } from 'vuepress-theme-plume'

export default defineUserConfig({
    // 请不要忘记设置默认语言
    lang: 'zh-CN',
    theme: plumeTheme({
        avatar: {
            url: '/vite-logo.png',
            name: 'RedA',
            description: 'description',
            circle: true, // 是否为圆形头像
        }
    }),
    bundler: viteBundler(),
})
