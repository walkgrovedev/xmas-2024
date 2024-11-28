<template>
  <div class="main-container" :class="{ 'hide': loggedIn }">

    <div class="welcome-container" v-if="!loggedIn">
      <div class='title'>Welcome</div>
      <div class="body">To our 2024 Advent Calendar Quiz!</div>
      <div class="body-small">Login to view the advent calendar.<br/>Select a door to answer the question - a new door will unlock each day! :0)</div>
    </div>

    <div class="form-container" v-if="!loggedIn && haveAccount">
      <div class='form-title'>Login</div>
      <div class="form-body">Ensure your details are entered below, then select Enter!</div>
      <form @submit.prevent="logIn">
        <div>
          <input type="text" id="name" v-model="name" placeholder="Enter your First Name" />
        </div>
        <div>
          <!-- <label for="userId">User ID:</label> -->
          <input type="text" id="passcode" v-model="passcode" placeholder="Enter your Passcode" />
        </div>
        <button class="form-btn" type="submit">Enter</button>
      </form>
      <div class="action-button" @click="haveAccount = false" v-if="!loggedIn && haveAccount">Create a passcode</div>
    </div>
    

    <div class="form-container" v-if="!loggedIn && !haveAccount">
      <div class='form-title'>Create login</div>
      <div class="form-body">Enter your details below - you'll only have to do this once.<br/>The passcode can be anything you wish and will save automatically to your browser.</div>
      <form @submit.prevent="newUser">
        <div>
          <input type="text" id="name" v-model="name" placeholder="Enter your First Name" />
        </div>
        <div>
          <input type="text" id="passcode" v-model="passcode" placeholder="Enter your Passcode" />
        </div>
        <div>
          <input type="email" id="email" v-model="email" placeholder="Enter your Email" />
        </div>
        <button class="form-btn" type="submit">Save</button>
      </form>
      <div class="action-button" @click="haveAccount = true" v-if="!loggedIn && !haveAccount">Enter a passcode</div>
    </div>
    

    <div class="message" v-html="showMessage"></div>

    <div v-if="loggedIn" class="advent-container" :load="setHeightWidths()" :class="{ 'show': dataLoaded }">
      <img ref="adventBgEl" id="adventBgEl" class="advent-background" src="/assets/XMAS.jpg" />

      <div class="advent" ref="adventEl" id="adventEl">
        <div class="advent-door-container" v-for="(day, index) in questions" :key="index" :style="{ 'grid-area': 'd'+index }" :class="{ 'showing': getShowingDoor(day.fields.Day), 'wait': quesAnswered === false && day.fields.Day === dayQ, 'disappear': quesAnswered === true && day.fields.Day === dayQ }">
          <button class="advent-door" @click="openQuestion(day.fields.Day)" :disabled="getOpenDoor(day.fields.Day)" :class="'door'+day.fields.Day">
            <img :src="'assets/day' + day.fields.Day + '.svg'" />
            <div class="lock" v-if="getOpenDoor(day.fields.Day)"></div>
            <span v-html="day.fields.Day"></span>
          </button>
        </div>
      </div>

      <!-- <h1>Users</h1>
      <ul>
        <li v-for="user in users" :key="user.id">
          {{ user.fields.UID }} | {{ user.fields.Name }}
        </li>
      </ul>

      <h1>Answers</h1>
      <ul v-if="answers.length > 0">
        <li v-for="ans in answers" :key="ans.id">
          {{ ans.fields.UID }} | {{ ans.fields.Day }} | {{ ans.fields.Answer }} | {{ ans.fields.ResponseTime }} | {{ ans.fields.Closed }}
        </li>
      </ul> -->
    </div>

    <div class="question-container" v-if="loggedIn && showQuestion">

      <div class="fade"></div>

      <div class="question">

        <div class="" v-html="question"></div>
        <div class="timer" v-html="remainingTime"></div>

        <form @submit.prevent="saveAnswer">
          <div>
            <input type="text" id="answer" v-model="answer" placeholder="Answer" style="width: 100px"/>
          </div>
          <button class="form-btn" type="submit">Save</button>
        </form>

      </div>

    </div>

  </div>

</template>

<script>
import axios from 'axios';

import { ref, onMounted, nextTick } from 'vue'

export default {
  setup() {
    // let adventEl = ref();
    // let adventBgEl = ref();

    window.addEventListener('resize', setHeightWidths);

    function setHeightWidths() {

      var adventEl = document.getElementById('adventEl');
      var adventBgEl = document.getElementById('adventBgEl');
      if(adventEl && adventBgEl) {
        const h = adventBgEl.getBoundingClientRect().height;
        const w = adventBgEl.getBoundingClientRect().width;
        const heigthVar = h+'px';
        const widthVar = w+'px';
        adventEl.style.height = heigthVar;
        adventEl.style.width = widthVar;
      }
    }

    return {
      // adventEl,
      // adventBgEl,
      setHeightWidths
    }
  },
  data() {
    return {
      loggedIn: false,
      haveAccount: false,
      showQuestion: false,
      dataLoaded: false,
      quesAnswered: false,
      showMessage: "",
      uid: null,
      name: null,
      passcode: null,
      email: null,
      day: null,
      dayQ: null,
      month: null,
      question: null,
      answer: null,
      respTime: null,
      users: [],
      answers: [],
      questions: [],
      remainingTime: 0,
      timer: null,
      personalAccessToken: 'pat6J9R93L312cNl7.c85803cbe5e1b322baa71103d105a494b01d7f78cb4364e87c29b5c536f6e69f',
      url: `https://api.airtable.com/v0/appr5Wxt0W5wd7frb`,
      userTbl: 'tbl6E2lNlkDVCjoXG',
      answTbl: 'tblAg38MzzwieSN0k',
      quesTbl: 'tblmLkhbn5c4ObeCL',
      testing: true,
      monthActive: 12
    };
  },
  methods: {
    async logIn() {
      this.showMessage = "";
      // check against the table - if passcode exists
      let exists = false;
      
      this.users.forEach(user => {
        if(user.fields.Name === this.name) {
          if(user.fields.UserID === this.passcode) {
            exists = true;
            this.uid = user.fields.UID;
          }
        }
      });
      // if not ...
      if(!exists) {
        this.showMessage = "Incorrect Name and/or Passcode!";
        return;
      }

      this.day = new Date().getDate();
      this.month = new Date().getMonth() + Number(1);

      this.loggedIn = true;

      window.localStorage.setItem('xmas-2024', JSON.stringify({name: this.name, passcode: this.passcode}));
      this.getRecords(['questions']);
    },
    newUser() {
      this.showMessage = "";
      // check not already in the table!
      let pexists = false;
      let eexists = false;
      this.users.forEach(user => {
        if(user.fields.UserID === this.passcode) pexists = true;
        if(user.fields.Email === this.email) eexists = true;
      });
      if(eexists) this.showMessage += "You've already set up a passcode for this email! Please <strong>Enter a passcode</strong> or <strong>ask Laura</strong> what it is :O)";
      if(pexists) this.showMessage += "Unavailable Passcode! Please choose another.";
      if(eexists || pexists) return;
      //add the user
      const userRecord = {
        fields: {
          Name: this.name,
          UserID: this.passcode,
          Email: this.email
        },
      };
      this.addRecord(userRecord, this.userTbl);
    },
    openQuestion(_day) {
      this.dayQ = _day;
      this.showQuestion = true;
      this.quesAnswered = false;
      this.questions.forEach(ques => {
        if(ques.fields.Day === _day) this.question = ques.fields.Question;
      });
      this.answerSetup();
    },
    getOpenDoor(_day) {
      let disabled = false;
      this.answers.forEach(ans => {
        if(ans.fields.UID === this.uid && ans.fields.Day === _day) {
          disabled = true; //if(ans.fields.Closed === true) 
        }
      });
      let activeMth = 12;
      if(this.testing === true) activeMth = 11;
      if(_day > this.day || this.month !== activeMth) { //
        disabled = true;
      }
      return disabled;
    },
    getShowingDoor(_day) {
      let shown = true;
      this.answers.forEach(ans => {
        if((ans.fields.UID === this.uid && ans.fields.Day === _day)) {
          shown = false;
        }
      });
      return shown;
    },
    answerSetup() {
      let alreadyActive = false;
      let closed = false;
      this.answers.forEach(ans => {
        if(ans.fields.UID === this.uid && ans.fields.Day === this.dayQ) {
          alreadyActive = true;
          closed = ans.fields.Closed;
        }
      });

      if(alreadyActive) {
        this.showMessage = "You've already attempted today's question!";
        this.showQuestion = false;
        return;
      }

      this.respTime = new Date();
      
      const userRecord = {
        fields: {
          UID: this.uid,
          Day: this.dayQ
        },
      };
      
      this.addRecord(userRecord, this.answTbl);

      this.remainingTime = 10;
      this.timer = setInterval(this.countdown, 1000);

    },
    countdown() {
      if (this.remainingTime === 0) {
        clearTimeout(this.timer);
        this.saveAnswer();
      } else {
        this.remainingTime--;
      }
    },
    saveAnswer() {
      // const day = new Date().getDate();

      clearTimeout(this.timer);

      const now = new Date();
      let resp = this.respTime;
      this.respTime = now - resp;
      
      let rId = null;
      let recordId = null;
      this.answers.forEach(ans => {
        if(ans.fields.UID === this.uid && ans.fields.Day === this.dayQ) {
          rId = ans.UID;
          recordId = ans.id;
        }
      });

      if(rId === null || recordId === null) return;

      const updateFields = {
        UID: rId,
        Day: this.dayQ,
        Closed: true,
        Answer: this.answer,
        ResponseTime: this.respTime
      };
      
      this.updateRecord(this.answTbl, updateFields, recordId);
      this.showQuestion = false;
      this.quesAnswered = true;
      // this.dayQ = null;
    },
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
      if(_tbl == "questions") url += `?sort[0][field]=Order&sort[0][direction]=asc`;
        try {
          const response = await axios.get(url, {
            headers: {
              Authorization: `Bearer ${this.personalAccessToken}`,
            },
          });
          switch(_tbl) {
            case 'users':
              this.users = response.data.records;
              if(this.passcode) {
                this.users.forEach(user => {
                  if(user.fields.UserID === this.passcode) this.uid = user.fields.UID;
                });
              }
              break;
            case 'answers':
              this.answers = response.data.records;
              break;
            case 'questions':
              this.questions = response.data.records;
              this.dataLoaded = true;
              break;
          }
        } catch (error) {
          console.error('Error fetching Airtable data:', error);
        }
    },
    async addRecord(newRecord, tbl) {
      const url = this.url + `/${tbl}`;
      try {
        const response = await axios.post(url, newRecord, {
          headers: {
            Authorization: `Bearer ${this.personalAccessToken}`,
            'Content-Type': 'application/json',
          },
        });
        this.getRecords(['users','answers']); // Refresh the data
        if(!this.loggedIn) {
          this.loggedIn = true;
          window.localStorage.setItem('xmas-2024', JSON.stringify({name: this.name, passcode: this.passcode}));
          this.getRecords(['questions']);
        }
      } catch (error) {
        console.error('Error adding record:', error);
      }
    },
    async updateRecord(tbl, updatedFields, recordId) {
      const url = this.url + `/${tbl}` + `/${recordId}`;

      try {
        const response = await axios.patch(url, { fields: updatedFields }, {
          headers: {
            Authorization: `Bearer ${this.personalAccessToken}`,
            'Content-Type': 'application/json',
          },
        });
        this.getRecords(['users','answers']); // Refresh the data
      } catch (error) {
        console.error('Error updating record:', error);
      }
    }
  },
  mounted() {
    this.day = new Date().getDate();
    const suspendString = window.localStorage.getItem('xmas-2024');
    if (suspendString !== null) {
      const suspendObject = JSON.parse(suspendString);
      this.name = suspendObject.name;
      this.passcode = suspendObject.passcode;
      this.haveAccount = true;
    }
    this.getRecords(['users','answers']);
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

  @keyframes fade-in {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }

  @keyframes scale-out {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    100% {
      transform: scale(0);
      opacity: 0;
    }
  }

  $fade-in: fade-in 0.5s ease-in-out;

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
        // display: none;
      }
      // width: 100%;
      // height: 100vh;
      // border: none;
    }

    .welcome-container {
      padding: 2rem;
      text-align: center;
      z-index: 1;
      // max-width: 50%;
      background: $white-opacity;
      border-radius: 2rem;
      margin-bottom: 1rem
    }

    .title {
      color: $leaf-green;
      font-size: 150%;
    }

    .body {
      padding: 1rem 0;
    }

    .body-small {
      font-family: 'Open sans', sans-serif;
      font-size: 50%;
      font-weight: 200;
    }

    .message {
      color: $dark-red;
      position: absolute;
      bottom: 1%;
    }
  }

  .question-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;

      z-index: 2;

      .fade {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;

        background-color: $white-opacity;
        pointer-events: none;
      }

      .question {
        position: absolute;
        top: 50%;
        left: 50%;
        width: auto;
        max-width: 75%;
        min-width: 20rem;;
        height: auto;
        transform: translate(-50%,-50%);

        padding: 2rem;
        z-index: 1;
        background-color: $pale;

        box-shadow: 0 0 10px $gold;
        border-radius: 2rem;

        input {
          font-size: 100%;
          border: none;
          text-align: center;
        }

        .timer {
          border: 3px solid $dark-red;
          background-color: $pale;
          border-radius: 100%;
          width: 4rem;
          height: 4rem;
          display: flex;
          align-items: center;
          justify-content: center;

          position: absolute;
          top: 0;
          right: 0;
          transform: translate(-50%,-50%);
        }

        text-align: center;
      }
    }

  .form-container {
    // border: 2px solid black;
    padding: 2rem;
    z-index: 1;
    background-color: $pale;

    box-shadow: 0 0 10px $gold;
    border-radius: 2rem;

    text-align: center;

    .form-title {
      color: $dark-red;
      font-size: 125%;
    }

    .form-body {
      font-family: 'Open sans', sans-serif;
      font-size: 50%;
      font-weight: 200;
      padding-bottom: 2rem;
    }

    form {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;

      input {
        font-size: 100%;
        border: none;
        text-align: center;
        margin: 0.25rem 0;
      }
    }
  }

  .action-button {
    cursor: pointer;
    font-style: italic;
    margin-top: 2rem;

    color: $dark-green;
  }

  .advent-container {
    z-index: 1;
    
    // width: 100%;
    // max-height: 100vh;
    width: 100%;
    height: auto;
    box-sizing: border-box;

    max-width: 1440px;

    opacity: 0;
    &.show {
      animation: fade-in;
      animation-duration: 1s;
      opacity: 1;
    }
  }

  .advent-background {

    width: 100%;
    height: auto;
    box-sizing: border-box;
  }

  .advent {

    position: relative;
    overflow: hidden;

    // display: none!important;
    padding: 0.4% 0.5% 0.9% 0.5%;
    box-sizing: border-box;

    position: absolute;
    width: 100%;
    height: 100%;
    top: 50%;
    left: 50%;
    transform: translate(-50%,-50%);
    // opacity: 0.75;

    display: grid;
    grid-template: 4fr 4fr;
    grid-template-columns: auto auto auto;
    grid-template-areas:
      'd0 d0 d1 d1 d2 d2 d3 d3 d4 d4 d5 d5 d6 d6'
      'd7 d7 d8 d8 d9 d9 d10 d10 d11 d11 d12 d12 d13 d13'
      'd14 d14 d15 d15 d16 d16 d17 d17 d18 d18 d19 d19 d20 d20'
      'd21 d21 d22 d22 d23 d23 d23 d23 d23 d24 d24 d24 d24 d24';
    gap: 0px;
    // background-color: blue;
    // padding: 0px;

    .advent-door-container {
      // background-color: $white-opacity;
      text-align: center;
      // padding: 10px;
      // margin: 1px;
      font-size: 30px;

      opacity: 0;
      &.disappear {
        animation: scale-out;
        animation-duration: 1s;
      }
      &.wait {
        opacity: 1;
        span {
          border: 5px solid $red;
        }
      }
      &.showing {
        opacity: 1;
      }

      .advent-door {
        width: 100%;
        height: 100%;

        text-align: left;

        font-size: 110%;
        color: $dark-green;

        background-color: transparent;
        position: relative;
        // transform: translate(0%, -5px);

        cursor: pointer;
        border: none;
        margin: 0;
        padding: 0 0.5rem;

        background-color: $white;
        // border-radius: 1rem;

        .lock {
          opacity: 0.3;
          position: absolute;
          top: 1rem;
          left: calc(100% - 2rem);
          width: 1rem;
          height: 1rem;

          background-image: url('/assets/lock.svg');
          background-size: contain;
          background-repeat: no-repeat;
        }

        &.door5, &.door22, &.door6, &.door7 {
          span {
            background-color: rgba($red, 0.4);
          }
        }

        &.door18, &.door13, &.door25, &.door10, &.door9, &.door14 {
          span {
            background-color: rgba($orange, 0.4);
          }
        }

        &.door8, &.door3, &.door21, &.door24, &.door16 {
          span {
            background-color: rgba($light-yellow, 0.4);
          }
        }

        &.door19, &.door12, &.door17, &.door15, &.door4 {
          span {
            background-color: rgba($mid-green, 0.4);
          }
        }

        &.door1, &.door20, &.door11, &.door23, &.door2 {
          span {
            background-color: rgba($blue, 0.4);
          }
        }


        span {
          // transform: translate(0%,-100%);
          padding: 0.5rem;
          margin: 0.25rem;
          box-sizing: border-box;
          // background-color: $white-opacity; //$white;
          border-radius: 0 1rem 0 1rem;
          width: calc(100% - 0.5rem);
          height: calc(100% - 0.5rem);
          display: block;
          position: absolute;
          top: 0;
          left: 0;
          z-index: 0;
          // -webkit-text-stroke: 1px $white;
          font-size: 150%;

          @media(max-width: 1280px){
            font-size: 125%;
          }

          @media(max-width: 1024px){
            font-size: 100%;
          }

          @media(max-width: 700px){
            font-size: 40%;
            padding: 0.25rem;
          }
        }

        img {
          z-index: 1;
          position: absolute;
          top: 75%;
          left: 75%;
          transform: translate(-75%,-75%);
          display: block;
          width: 60%;
          height: 60%;
          object-fit: contain;
        }

        &:disabled {
          cursor: default;
          span {
            // opacity: 0.5;
          }
        }
      }

    }

  }
</style>
