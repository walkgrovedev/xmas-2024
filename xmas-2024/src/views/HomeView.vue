<template>

  <div class="form-container" v-if="!loggedIn && haveAccount">
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
  

  <div v-html="showMessage"></div>

  <div v-if="loggedIn && !showQuestion">

    <div class="advent">
      <div class="advent-door-container" v-for="(day, index) in questions" :key="index" :style="{ 'grid-area': 'd'+index }" :class="{ 'showing': getShowingDoor(day.fields.Day) }">
        <button class="advent-door" v-html="day.fields.Day" @click="openQuestion(day.fields.Day)" :disabled="getOpenDoor(day.fields.Day)"></button>
      </div>
    </div>

    <h1>Users</h1>
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
    </ul>
  </div>

  <div v-if="loggedIn && showQuestion">

    <div class="" v-html="question"></div>
    <div class="" v-html="remainingTime"></div>

    <form @submit.prevent="saveAnswer">
      <div>
        <input type="text" id="answer" v-model="answer" placeholder="Enter your Answer" />
      </div>
      <button type="submit">Save</button>
    </form>

  </div>

</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      loggedIn: false,
      haveAccount: false,
      showQuestion: false,
      showMessage: "",
      uid: null,
      name: null,
      passcode: null,
      email: null,
      day: null,
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
      quesTbl: 'tblmLkhbn5c4ObeCL'
    };
  },
  methods: {
    logIn() {
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
      this.day = _day;
      this.showQuestion = true;
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
      if(_day > this.day) {
        disabled = true;
      }
      return disabled;
    },
    getShowingDoor(_day) {
      let shown = true;
      this.answers.forEach(ans => {
        if(ans.fields.UID === this.uid && ans.fields.Day === _day) {
          shown = false;
        }
      });
      return shown;
    },
    answerSetup() {
      // const day = new Date().getDate();

      let alreadyActive = false;
      let closed = false;
      this.answers.forEach(ans => {
        if(ans.fields.UID === this.uid && ans.fields.Day === this.day) {
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
          Day: this.day
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

      const now = new Date();
      let resp = this.respTime;
      this.respTime = now - resp;
      
      let rId = null;
      let recordId = null;
      this.answers.forEach(ans => {
        if(ans.fields.UID === this.uid && ans.fields.Day === this.day) {
          rId = ans.UID;
          recordId = ans.id;
        }
      });

      if(rId === null || recordId === null) return;

      const updateFields = {
        UID: rId,
        Day: this.day,
        Closed: true,
        Answer: this.answer,
        ResponseTime: this.respTime
      };
      
      this.updateRecord(this.answTbl, updateFields, recordId);
      this.showQuestion = false;
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
      const url = this.url + `/${table}`;
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

<style scoped lang="scss">

  @keyframes fade-in {
    0% {
      opacity: 0;
    }
    50% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }

  $fade-in: fade-in 0.5s ease-in-out;

  .form-container {
    border: 2px solid black;
    padding: 2rem;

    box-shadow: 0 0 10px black;
   
    form {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
    }
  }

  .action-button {
    cursor: pointer;
    font-style: italic;
    margin-top: 2rem;
  }

  .advent {
    display: grid;
    grid-template-areas:
      'd0 d0 d0 d1 d1'
      'd2 d2 d2 d2 d2'
      'd3 d3 d4 d4 d4';
    gap: 0px;
    background-color: blue;
    padding: 0px;

    .advent-door-container {
      background-color: rgba(255, 255, 255, 0.8);
      text-align: center;
      padding: 10px;
      font-size: 30px;

      opacity: 0;
      &.showing {
        opacity: 1;
      }

      .advent-door {
        width: 100%;
        height: 100%;
        background-color: transparent;
        cursor: pointer;
        border: none;
        transform: translate(0%,-7px);
        padding: 0;

        &:disabled {
          cursor: default;
        }
      }

    }
  }
</style>
