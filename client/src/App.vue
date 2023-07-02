<script setup>
import Article from "./views/Article.vue"
</script>

<template>
  <main>
    <Article />
  </main>
</template>

<style scoped>
main {
  max-width: 80%;
  margin: auto;
}
@media (max-width: 1000px) {
  main {
    min-width: 100%;
    margin: auto;
  }
}
</style>
