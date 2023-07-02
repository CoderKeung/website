<script setup>
import {ref, h} from "vue"
import axios from "axios"

const url = ref(null)
const loadingActive = ref(false)
var articles = []

function post(){
  loadingActive.value = true
  axios.post("/api/conversion",{
    url: url.value
  }).then((res)=>{
    loadingActive.value = false
    const data = res.data;
    articles.push({
      title: data.title,
      author: data.author.name,
      id: data.id,
      path: "/api/"+data.title+".docx"
    })
  })
}
var urlStatus = "null"
function isUrl(){
  return /^(https?:\/\/(([a-zA-Z0-9]+-?)+[a-zA-Z0-9]+\.)+[a-zA-Z]+)(:\d+)?(\/.*)?(\?.*)?(#.*)?$/.test(url.value)
}

function onInput() {
  console.log(isUrl())
  if(!isUrl(url.value)){
    urlStatus = "error"
  } else {
    urlStatus = "null"
  }
}
</script>

<template>
  <h2>美篇简篇文章转成文档</h2>
  <article>
  <n-input
    type="text"
    v-model:value ="url"
    :status=urlStatus
    placeholder="https://www.jianpian.cn/a/jpp54yq"
    :loading=loadingActive
    @input ="onInput"
  />
  <n-button class="submit" type="success" @click="post">转换</n-button>
  </article>
      <n-card v-for="value in articles" v-model:title="value.title" :articleId="value.id">
        <a :href="value.path">
          <n-button>点击下载</n-button>
        </a>
      </n-card>
</template>

<style>
h2 {
  text-align: center;
}
article {
  display: flex;
  margin-bottom: 10px;
}
.n-input__input {
  font-size: 16px;
  height: 40px;
  align-items: center;
  display: flex;
}
.submit {
  width: 100px;
  height: 40px;
  font-size: 16px;
  font-weight: bold;
  margin-left: 10px;
}
.n-card {
  text-align: center;
  cursor: pointer;
}
.n-card__content {
  padding: 2px;
}
@media (max-width: 1000px) {
.n-card-header__main {
  font-size: 14px;
}
.n-input__input {
  font-size: 14px;
}
.submit {
  font-size: 14px;
  width: 80px;
}
.n-card {
  margin-right: 20px;
}
article {
  margin: 10px;
}
}
</style>