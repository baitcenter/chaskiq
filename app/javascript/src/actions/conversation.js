import ActionTypes from '../constants/action_types';
import graphql from '../graphql/client'

import {
  CONVERSATION, 
  AGENTS
} from "../graphql/queries"

import { 
  INSERT_COMMMENT, 
  ASSIGN_USER,
  INSERT_NOTE,
  UPDATE_CONVERSATION_STATE,
  TOGGLE_CONVERSATION_PRIORITY
} from '../graphql/mutations'

import { camelCase } from 'lodash';
import {soundManager} from 'soundmanager2'


const camelizeKeys = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(v => camelizeKeys(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => ({
        ...result,
        [camelCase(key)]: camelizeKeys(obj[key]),
      }),
      {},
    );
  }
  return obj;
};


export function getConversation(options, cb){
  return (dispatch, getState)=>{

      setLoading(true)

      const conversationMeta = getState().conversation.meta
      const nextPage = conversationMeta ? (conversationMeta.next_page || 1) : 1


      graphql(CONVERSATION, { 
        appKey: getState().app.key, 
        id: parseInt(options.id), 
        page: nextPage
      }, {
        success: (data)=>{
          const conversation = data.app.conversation


          const newConversation = Object.assign({}, { 
                                                      collection: nextPage > 1 ? 
                                                        getState().conversation.collection.concat(conversation.messages.collection) : 
                                                        conversation.messages.collection,
                                                      meta: conversation.messages.meta,
                                                      loading: false
                                                    },
                              conversation)
          
          dispatch(dispatchGetConversations(newConversation))

          cb ? cb() : null

          //this.props.setConversation(conversation, () => {
            /*this.conversationSubscriber()

            const lastItem = last(this.state.messages)
    
            this.setState({
              messages: nextPage > 1 ? 
                this.state.messages.concat(conversation.messages.collection) : 
                conversation.messages.collection,
              meta: conversation.messages.meta,
              loading: false
            },  ()=>{
              //console.log(lastItem)
              //this.getMainUser(this.state.conversation.mainParticipant.id)
              // TODO: this will scroll scroll to last when new items are added!
              cb ? cb(lastItem ? lastItem.id : null) : null
            })*/
          //})
        },
        error: (error)=>{
          
        }
      }) 


  }
}

export function clearConversation(cb){
  return (dispatch, getState)=>{
    dispatch(dispatchGetConversations({}))
    cb ? cb() : null
  }
}

export function insertComment(comment, cb){
  return (dispatch, getState) => {

    graphql(INSERT_COMMMENT, { 
      appKey: getState().app.key, 
      id: getState().conversation.id, 
      message: comment
    }, {
        success: (data)=>{
          console.log(data)
          cb()
        },
        error: (error)=>{
          console.log(error)
        }
      })

  }
}

export function insertNote(key, cb){
  return (dispatch, getState) => {

    graphql(INSERT_NOTE, { 
      appKey: this.props.appId, 
      id: id, 
      message: comment
    }, {
        success: (data)=>{
          console.log(data)
          cb()
        },
        error: (error)=>{
          console.log(error)
        }
      })
  }
}

export function appendMessage(data, cb){
  return (dispatch, getState)=>{

    const newData = camelizeKeys(data)

    // update existing message
    if (getState().conversation.collection.find((o) => o.id === newData.id ) ){
      const new_collection = getState().conversation.collection.map((o)=>{
        if (o.id === newData.id ){
            return newData
          } else {
            return o
          }
      })

      const newMessages = Object.assign({}, 
        getState().conversation,
        { collection: new_collection }
      )

      dispatch(dispatchGetConversations(newMessages))

    } else {

      if (getState().current_user.email !== newData.appUser.email) {
        playSound()
      }

      const newMessages = Object.assign({}, 
                    getState().conversation,
                    { collection: [newData].concat(getState().conversation.collection) }, 
        
      )

      dispatch(dispatchGetConversations(newMessages))

      cb ? cb() : null
    }

  }
}

export function assignUser(key, cb){
  return (dispatch, getState) => {
  }
}

export function setLoading(val){
  return (dispatch, getState)=>{
    dispatch(dispatchUpdateConversations({loading: val}))
  }
}

export function toggleConversationPriority(key, cb){
  return (dispatch, getState) => {
  }
}

export function updateConversationState(state, cb){
  return (dispatch, getState)=>{
    graphql(UPDATE_CONVERSATION_STATE, {
      appKey: getState().app.key, 
      conversationId: getState().conversation.id,
      state: state
    }, {
      success: (data)=>{
        const conversation = data.updateConversationState.conversation

        const newConversation = Object.assign({}, getState().conversation, conversation)
        dispatch(dispatchGetConversations(newConversation))

        cb ? cb(newConversation) : null
      },
      error: (error)=>{
      }
    })

  }
}

export function updateConversationPriority(cb){

  return (dispatch, getState)=>{
    graphql(TOGGLE_CONVERSATION_PRIORITY, {
      appKey: getState().app.key, 
      conversationId: getState().conversation.id,
    }, {
      success: (data)=>{
        const conversation = data.toggleConversationPriority.conversation
        const newConversation = Object.assign({}, getState().conversation, conversation)
        dispatch(dispatchGetConversations(newConversation))
        cb ? cb(newConversation) : null
      },
      error: (error)=>{
      }
    })    
  }

}

export function assignAgent(id, cb){
  return (dispatch, getState)=>{


    graphql(ASSIGN_USER, {
      appKey: getState().app.key, 
      conversationId: getState().conversation.id,
      appUserId: id
    }, {
      success: (data)=>{
        const conversation = data.assignUser.conversation
        const newConversation = Object.assign({}, getState().conversation, conversation)
        dispatch(dispatchGetConversations(newConversation))
        cb ? cb(data.assignUser.conversation) : null
      },
      error: (error)=>{

      }
    })

  }
}

function dispatchGetConversations(data) {
  return {
    type: ActionTypes.GetConversation,
    data: data
  }
}

function dispatchUpdateConversations(data) {
  return {
    type: ActionTypes.GetConversation,
    data: data
  }
}


function playSound(){
  soundManager.createSound({
    id: 'mySound',
    url: '/sounds/pling.mp3',
    autoLoad: true,
    autoPlay: false,
    //onload: function () {
    //  alert('The sound ' + this.id + ' loaded!');
    //},
    volume: 50
  }).play()
}


const initialState = {}

// Reducer
export default function reducer(state = initialState, action = {}) {
  switch(action.type) {
    case ActionTypes.GetConversation: {
      return action.data
    }
    case ActionTypes.UpdateConversation: {
      return Object.merge({}, action.data, state)
    }
    default:
      return state;
  }
}