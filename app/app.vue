<script setup>
const config = useRuntimeConfig()
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: `${config.app.baseURL}favicon.ico` }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

const title = 'DoReMi 3D Challenge'
const description = 'A voice-controlled 3D game where you control a ball\'s height by singing notes from Do to Si. Master your pitch to avoid obstacles!'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description
})
</script>

<template>
  <UApp>
    <UHeader
      class="z-20"
      :toggle="false"
    >
      <template #left>
        <NuxtLink to="/">
          <h1 class="header-font text-2xl font-bold">DOREMI Challenge</h1>
        </NuxtLink>
      </template>

      <template #right>
        <UButton
          to="https://github.com/FabienCont/DoReMi_challenge"
          target="_blank"
          icon="i-simple-icons-github"
          aria-label="GitHub"
          color="neutral"
          variant="ghost"
        />
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>
  </UApp>
</template>

<style scoped>
*{
  font-family: 'Roboto', sans-serif;
}

.header-font {
  font-family: 'Blue Winter';
}
</style>
