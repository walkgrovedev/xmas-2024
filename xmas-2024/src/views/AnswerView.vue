<template>
  <div class="main-container">

    <h1 class="title">Questions</h1>
    <div class="answer-container">

      <div v-for="ques in questions" :key="ques.Day" v-if="questions.length > 0">
        <div class="ques">
          <div class="body-day">{{ ques.fields.Day }}</div>
          <div class="body">{{ ques.fields.Question }}</div>
        </div>

        <table class="body-table">
          <tr><th width="50%">Name</th><th width="25%">Answer</th><th width="25%">Response Time (seconds)</th></tr>
          <tr v-for="ans in getAnswersByDay(ques.fields.Day)" :key="ans.Day" v-if="getAnswersByDay(ques.fields.Day).length > 0">
            <td>{{ getUserName(ans.fields.UID) }}</td><td>{{ ans.fields.Answer }}</td><td>{{ ans.fields.ResponseTime/1000 }}</td>
          </tr>
        </table>

        <div class="body-answer">Correct answer: <span>{{ ques.fields.Answer }}</span></div>
        <div>&nbsp;</div>
      </div>

      <!-- <h1>Answers</h1>
      <ul v-if="answers.length > 0">
        <li v-for="ans in answers" :key="ans.id">
          
        </li>
      </ul> -->

    </div>

  </div>

</template>

<script>
import axios from 'axios';

import { ref, onMounted, nextTick } from 'vue'

export default {
  setup() {

    window.addEventListener('resize', setHeightWidths);

    function setHeightWidths() {
      // var adventEl = document.getElementById('adventEl');
      // var adventBgEl = document.getElementById('adventBgEl');
      // if(adventEl && adventBgEl) {
      //   const h = adventBgEl.getBoundingClientRect().height;
      //   const w = adventBgEl.getBoundingClientRect().width;
      //   const heigthVar = h+'px';
      //   const widthVar = w+'px';
      //   adventEl.style.height = heigthVar;
      //   adventEl.style.width = widthVar;
      // }
    }

    return {
      setHeightWidths
    }
  },
  data() {
    return {
      users: [],
      answers: [],
      questions: [],
      personalAccessToken: 'pat6J9R93L312cNl7.c85803cbe5e1b322baa71103d105a494b01d7f78cb4364e87c29b5c536f6e69f',
      url: `https://api.airtable.com/v0/appr5Wxt0W5wd7frb`,
      userTbl: 'tbl6E2lNlkDVCjoXG',
      answTbl: 'tblAg38MzzwieSN0k',
      quesTbl: 'tblmLkhbn5c4ObeCL',
    };
  },
  methods: {
    getRecords(_tbl) {
      _tbl.forEach(table => {
        let tbl = 'users';
        switch(table) {
          case 'users':
            tbl = this.userTbl;
            break;
          case 'answers':
            tbl = this.answTbl;
            break;
          case 'questions':
            tbl = this.quesTbl;
            break;
        }
        this.collectRecords(table, tbl);
      });
    },
    async collectRecords(_tbl, table) {
      let url = this.url + `/${table}`;
      if(_tbl == "questions") url += `?sort[0][field]=Day&sort[0][direction]=asc`;
      if(_tbl == "answers") url += `?sort[0][field]=Answer&sort[0][direction]=asc`;
        try {
          const response = await axios.get(url, {
            headers: {
              Authorization: `Bearer ${this.personalAccessToken}`,
            },
          });
          switch(_tbl) {
            case 'users':
              this.users = response.data.records;
              break;
            case 'answers':
              this.answers = response.data.records;
              break;
            case 'questions':
              this.questions = response.data.records;
              break;
          }
        } catch (error) {
          console.error('Error fetching Airtable data:', error);
        }
    },
    getUserName(_uid) {
      let name = "";
      this.users.forEach(user => {
        if(user.fields.UID === _uid) {
          name = user.fields.Name;
        }
      });
      return name;
    },
    getAnswersByDay(_day) {
      let answers = [];
      this.answers.forEach(ans => {
        if(ans.fields.Day === _day) {
          answers.push(ans);
        }
      });
      return answers;
    }
  },
  mounted() {
    this.getRecords(['users','answers','questions']);
  },
};
</script>

<style scoped lang="scss" >

  // @import "../assets/main.scss";

  $pale: #f7f7f3;
  $gold: #b19680;
  $leaf-green: #90a77b; //#516e37;
  $dark-green: #4a6234;
  $dark-red: #d42e10;

  $white: #fff;
  $white-opacity: rgba(255, 255, 255, 0.8);


  $red: #f40a03;
  $orange: #ff7c22;
  $yellow: #fdbc03;
  $light-yellow: #fece4f;
  $light-green: #8caa7e;
  $mid-green: #537e74;
  $darker-green: #416252;
  $blue: #3d4655;

  

  .main-container {

    font-size: 2rem;
    position: relative;
    overflow: hidden;

    border: 5px solid $gold;
    width: calc(100% - 4rem);
    height: calc(100vh - 4rem);

    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;

    position: relative;

    overflow: hidden;

    &:before, &:after {
      content: "";
      position: absolute;
      z-index: 0;
    }

    &:before {
      background: url('/assets/ribbon-green.svg');
      background-size: contain;
      background-position: top left;
      background-repeat: no-repeat;
      transform: translate(-5%, -10%);
      width: 50%;
      height: 50%;
      top: 0;
      left: 0;
    }
    &:after {
      background: url('/assets/green.svg');
      background-size: contain;
      background-position: bottom right;
      background-repeat: no-repeat;
      transform: translate(0%, 10%);
      width: 50%;
      height: 50%;
      bottom: 0;
      right: 0;
    }

    &.hide {
      &:before, &:after {

      }
    }

    .ques {
      display: flex;
      align-items: center;
    }

    .title {
      color: $dark-green;
      margin: 0;
    }

    .body-day {
      color: $dark-red;
      margin-right: 1rem;
      margin-bottom: 1rem;
    }

    .body {
      font-family: 'Open sans', sans-serif;
      font-size: 60%;
    }

    .body-answer {
      font-family: 'Open sans', sans-serif;
      font-weight: 200;
      font-size: 60%;
      span {
        font-family: "Caveat Brush", cursive;
        color: $leaf-green;
        font-weight: bold;
        font-size: 150%;
      }
    }

    .body-table {
      
    }

    table {
      width: 75%;
      margin: 0 auto;
      border-collapse: collapse;

      th, td {
        border: 1px solid $dark-green;
        padding: 0.25rem 1rem;
      }

      th {
        font-size: 75%;
        font-weight: 200;
        background-color: $light-green;
        // color: $white;
        // border: 1px solid $white;
      }
      td {
        font-family: 'Open sans', sans-serif;
        font-size: 50%;
      }

    }
    .answer-container {
      width: 50%;
      height: 70%;
      overflow: hidden;
      overflow-y: auto;
    }

  }
</style>
