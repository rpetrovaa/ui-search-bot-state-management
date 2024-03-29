import { Component, OnInit } from '@angular/core';

declare var $: any;
import 'jqueryui';

import { PostRequestService } from 'src/app/services/post-request.service';
import { PostRequest, PostResult } from 'src/app/classes/post';
import { SetStateService } from 'src/app/services/set-state.service';
import { Select, Store } from '@ngxs/store';
import { QueryState } from 'src/app/state/query.state';
import { Observable } from 'rxjs';
import { DiffService } from 'src/app/services/diff.service';
import { RequestType } from 'src/app/model/query.model';
import { IntersectService } from 'src/app/services/intersect.service';

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css'],
})
export class ChatbotComponent implements OnInit {
  postRequest: PostRequest = null;
  request: PostRequest;
  requestNegative: PostRequest;
  requestExtended: PostRequest;
  message: any;
  lastResults;
  @Select(QueryState.getLastQuery) lastQuery$: Observable<any[]>;
  diff: PostResult[];
  intersect: PostResult[];
  state: RequestType;
  stateExt: RequestType;
  counter: number = 0;
  requestMoreScreens: any;

  constructor(
    private postRequestService: PostRequestService,
    private setStateService: SetStateService,
    private diffService: DiffService,
    private intersectService: IntersectService
  ) {
    // Inject all the servises from the angular components in the JQuery chatbot widget to pass information on serch requests to the state managing component
    if (!this.setStateService.requestNegative) return;
    this.setStateService.requestNegative.subscribe((requestNegative) => {
      if (this.requestNegative) {
        this.requestNegative = requestNegative.postRequest;
        this.state = requestNegative.requestType;
      }
    });

    if (!this.setStateService.requestExtended) return;
    this.setStateService.requestExtended.subscribe((requestExtended) => {
      if (requestExtended) {
        this.requestExtended = requestExtended.postRequest;
        this.stateExt = requestExtended.requestType;
      }
    });

    if (!this.setStateService.requestMoreScreens) return;
    this.setStateService.requestMoreScreens.subscribe((requestMoreScreens) => {
      if (requestMoreScreens) {
        this.requestMoreScreens = requestMoreScreens.postRequest;
        this.state = requestMoreScreens.requestType;
      }
    });

    if (!this.diffService.diff) return;
    this.diffService.diff.subscribe((diff) => {
      this.diff = diff;
    });

    if (!this.intersectService.intersect) return;
    this.intersectService.intersect.subscribe((intersect) => {
      this.intersect = intersect;
    });

    this.lastQuery$.subscribe((results) => (this.lastResults = results));
  }

  // Initialize local variables and methods in the jQuery code for the chatbot widget to map to the above defined Angular variables
  ngOnInit() {
    //initialization
    //$(document).ready(function() {
    let postRequestService = this.postRequestService;
    let setStateServiceLocal = this.setStateService;

    //Bot pop-up intro
    $('div').removeClass('tap-target-origin');

    //drop down menu for close, restart conversation & clear the chats.
    (<any>$('.dropdown-trigger')).dropdown();

    //initiate the modal for displaying the charts, if you dont have charts, then you comment the below line
    (<any>$('.modal')).modal();

    //enable this if u have configured the bot to start the conversation.
    // showBotTyping();
    // $("#userInput").prop('disabled', true);

    //global variables
    let action_name = 'action_greet_user';
    let user_id = 'participant';
    let messageGlobal = this.message;
    let requestGlobalNegatve = this.requestNegative;
    let requestGlobalExtended = this.requestExtended;
    let stateGlobal = this.state;
    let counterGlobal = this.counter;

    //if you want the bot to start the conversation
    // action_trigger();

    //})

    // ========================== restart conversation ========================
    function restartConversation() {
      $('#userInput').prop('disabled', true);
      //destroy the existing chart
      $('.collapsible').remove();
      //if (typeof modalChart !== 'undefined') { modalChart.destroy(); }
      $('.chats').html('');
      $('.usrInput').val('');
      send('/restart');
    }

    // ========================== let the bot start the conversation ========================
    function action_trigger() {
      // send an event to the bot, so that bot can start the conversation by greeting the user
      $.ajax({
        url: `http://localhost:5005/conversations/${user_id}/execute`,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
          name: action_name,
          policy: 'MappingPolicy',
          confidence: '0.98',
        }),
        success: function (botResponse, status) {
          console.log(
            'Response from Rasa: ',
            botResponse,
            '\nStatus: ',
            status
          );

          if (botResponse.hasOwnProperty('messages')) {
            setBotResponse(botResponse.messages);
          }
          $('#userInput').prop('disabled', false);
        },
        error: function (xhr, textStatus, errorThrown) {
          // if there is no response from rasa server
          setBotResponse('');
          console.log('Error from bot end: ', textStatus);
          $('#userInput').prop('disabled', false);
        },
      });
    }

    //=====================================	user enter or sends the message =====================
    $('.usrInput').on('keyup keypress', function (e) {
      var keyCode = e.keyCode || e.which;

      var text = <any>$('.usrInput').val();
      if (keyCode === 13) {
        if (text == '' || $.trim(text) == '') {
          e.preventDefault();
          return false;
        } else {
          //destroy the existing chart, if yu are not using charts, then comment the below lines
          $('.collapsible').remove();
          //if (typeof modalChart !== 'undefined') { modalChart.destroy(); }
          $('.usrInput').blur();
          setUserResponse(text);
          send(text);
          e.preventDefault();
          return false;
        }
      }
    });

    $('#sendButton').on('click', function (e) {
      var text = <any>$('.usrInput').val();
      if (text == '' || $.trim(text) == '') {
        e.preventDefault();
        return false;
      } else {
        $('.suggestions').remove();
        $('#paginated_cards').remove();
        $('.quickReplies').remove();
        $('.usrInput').blur();
        setUserResponse(text);
        send(text);
        e.preventDefault();
        return false;
      }
    });

    //==================================== Set user response =====================================
    function setUserResponse(message) {
      var UserResponse =
        '<img class="userAvatar" src=' +
        './assets/img/userAvatar.jpg' +
        '><p class="userMsg">' +
        message +
        ' </p><div class="clearfix"></div>';
      $(UserResponse).appendTo('.chats').show('slow');

      $('.usrInput').val('');
      scrollToBottomOfResults();
      showBotTyping();
      $('.suggestions').remove();
    }

    //=========== Scroll to the bottom of the chats after new message has been added to chat ======
    function scrollToBottomOfResults() {
      var terminalResultsDiv = document.getElementById('chats');
      terminalResultsDiv.scrollTop = terminalResultsDiv.scrollHeight;
    }

    //============== send the user message to rasa server =============================================
    function send(message) {
      console.log('this message', message);

      $.ajax({
        url: 'http://localhost:5005/webhooks/rest/webhook', // REST proxy to Rasa server
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ message: message, sender: user_id }),

        success: function (botResponse, status) {
          console.log(
            'message:',
            message,
            '\nResponse from Rasa: ',
            botResponse,
            '\nStatus: ',
            status
          );

          // if user wants to restart the chat and clear the existing chat contents
          if (message.toLowerCase() == '/restart') {
            $('#userInput').prop('disabled', false);

            // reset the state of the search session
            counterGlobal = 0;

            setBotResponse('Restarting the conversation.');

            //if you want the bot to start the conversation after restart
            // action_trigger();
            return;
          }

          messageGlobal = message;
          setBotResponse(botResponse);
        },
        error: function (xhr, textStatus, errorThrown) {
          if (message.toLowerCase() == '/restart') {
            // $("#userInput").prop('disabled', false);
            //if you want the bot to start the conversation after the restart action.
            // action_trigger();
            // return;
            stateGlobal = RequestType.INITIAL;
          }

          // if there is no response from rasa server
          setBotResponse('');
          console.log('Error from bot end: ', textStatus);
        },
      });
    }

    //=================== set bot response in the chats ===========================================
    function setBotResponse(response) {
      //display bot response after 500 milliseconds
      setTimeout(function () {
        hideBotTyping();
        if (response.length < 1) {
          //if there is no response from Rasa, send  fallback message to the user
          var fallbackMsg =
            "Sorry, I didn't get that. Could you please rephase?";
          // 'I am facing some issues, please try again later!!!';

          var BotResponse =
            '<img class="botAvatar" src="./assets/img/sara_avatar.png"/><p class="botMsg">' +
            fallbackMsg +
            '</p><div class="clearfix"></div>';

          $(BotResponse).appendTo('.chats').hide().fadeIn(1000);
          scrollToBottomOfResults();
        } else {
          //if we get response from Rasa
          for (let i = 0; i < response.length; i++) {
            console.log('bot response:', response);
            //check if the response contains "text"
            if (response[i].hasOwnProperty('text')) {
              var BotResponse =
                '<img class="botAvatar" src="./assets/img/sara_avatar.png"/><p class="botMsg">' +
                response[i].text +
                '</p><div class="clearfix"></div>';
              $(BotResponse).appendTo('.chats').hide().fadeIn(1000);
            }

            //check if the response contains "images"
            if (response[i].hasOwnProperty('image')) {
              var BotResponse =
                '<div class="singleCard">' +
                '<img class="imgcard" src="' +
                response[i].image +
                '">' +
                '</div><div class="clearfix">';
              $(BotResponse).appendTo('.chats').hide().fadeIn(1000);
            }

            //check if the response contains "custom" message
            if (response[i].hasOwnProperty('custom')) {
              //check if the custom payload type is "dropDown"
              if (response[i].custom.payload == 'dropDown') {
                const dropDownData = response[i].custom.data;
                renderDropDwon(dropDownData);
                return;
              }

              //check of the custom payload type is "query_extended" for Additive type requests
              if (response[i].custom.payload == 'query_extended') {
                if (!messageGlobal) {
                  return;
                }

                // retrieve the search related terms in the request forwarded by the Rasa Server
                let slot_value = response[i].custom.data.text.query;

                // If no slot or entity has been extracted, forward the whole search utterance to the retieval component.
                if (!slot_value) {
                  requestGlobalExtended =
                    postRequestService.createPostRequest(messageGlobal);
                } else {
                  requestGlobalExtended =
                    postRequestService.createPostRequest(slot_value);
                }

                if (!requestGlobalExtended) {
                  return;
                }

                // counter variable to track the state of a seach session
                if (counterGlobal === 0) {
                  stateGlobal = RequestType.INITIAL; // when the user want to make the first request in a search session
                } else {
                  stateGlobal = RequestType.ADDITIVE; // when the user has already made the first request in a search session and wants to make another request of type additive
                }

                var BotResponse = '';

                if (slot_value && counterGlobal === 0) {
                  BotResponse =
                    '<img class="botAvatar" src="./assets/img/sara_avatar.png"/><p class="botMsg">' +
                    'Here are your ' +
                    slot_value +
                    ' results.' +
                    '</p><div class="clearfix"></div>';
                  $(BotResponse).appendTo('.chats').hide().fadeIn(1000);
                } else {
                  BotResponse =
                    '<img class="botAvatar" src="./assets/img/sara_avatar.png"/><p class="botMsg">' +
                    'Here are your results.' +
                    '</p><div class="clearfix"></div>';
                  $(BotResponse).appendTo('.chats').hide().fadeIn(1000);
                }

                // Notify the rest of the system about the change in the state (new additive request)
                setStateServiceLocal.setActionExtended(
                  requestGlobalExtended,
                  stateGlobal,
                  counterGlobal
                );
                counterGlobal += 1;
              }

              //check of the custom payload type is "query_negative"; when the user wants to make a negative request
              if (response[i].custom.payload == 'query_negative') {
                if (counterGlobal === 0) return;
                if (!messageGlobal) {
                  return;
                }

                // retrieve the search related terms in the request forwarded by the Rasa Server
                let slot_value = response[i].custom.data.text.query;

                // If no slot or entity has been extracted, forward the whole search utterance to the retieval component.
                if (!slot_value) {
                  requestGlobalNegatve =
                    postRequestService.createPostRequest(messageGlobal);
                } else {
                  requestGlobalNegatve =
                    postRequestService.createPostRequest(slot_value);
                }

                if (!requestGlobalNegatve) {
                  return;
                }

                var BotResponse = '';

                if (!slot_value) {
                  BotResponse =
                    '<img class="botAvatar" src="./assets/img/sara_avatar.png"/><p class="botMsg">' +
                    'Here are your results.' +
                    '</p><div class="clearfix"></div>';
                  $(BotResponse).appendTo('.chats').hide().fadeIn(1000);
                } else {
                  BotResponse =
                    '<img class="botAvatar" src="./assets/img/sara_avatar.png"/><p class="botMsg">' +
                    'Here are your results without ' +
                    slot_value +
                    '.' +
                    '</p><div class="clearfix"></div>';
                  $(BotResponse).appendTo('.chats').hide().fadeIn(1000);
                }

                stateGlobal = RequestType.NEGATIVE;

                // Notify the rest of the system about the change in the state (new negative request)
                setStateServiceLocal.setActionNegative(
                  requestGlobalNegatve,
                  stateGlobal,
                  counterGlobal
                );

                counterGlobal += 1;
              }

              // check of the custom payload type is "more_screens"; when the user wants to see the next top 20 screens
              if (response[i].custom.payload == 'more_screens') {
                stateGlobal = RequestType.ADDITIVE;

                // Notify the rest of the system about the change in the state (new request for more screens)
                setStateServiceLocal.setActionMoreScreens(
                  postRequestService.createPostRequest('more screens'),
                  stateGlobal,
                  counterGlobal
                );

                counterGlobal += 1;
              }

              // reset state back to "INITIAL" on requesting more screens; resets the search sessions state
              if (response[i].custom.payload == 'reset_state') {
                counterGlobal = 0;
              }
            }
          }
          scrollToBottomOfResults();
        }
      }, 500);
    }

    //====================================== Toggle chatbot =======================================
    $('#profile_div').click(function () {
      $('.profile_div').toggle();
      $('.widget').toggle();
    });

    //====================================== DropDown ==================================================
    //render the dropdown messageand handle user selection
    function renderDropDwon(data) {
      var options = '';
      for (let i = 0; i < data.length; i++) {
        options +=
          '<option value="' +
          data[i].value +
          '">' +
          data[i].label +
          '</option>';
      }
      var select =
        '<div class="dropDownMsg"><select class="browser-default dropDownSelect"> <option value="" disabled selected>Choose your option</option>' +
        options +
        '</select></div>';
      $('.chats').append(select);
      scrollToBottomOfResults();

      //add event handler if user selects a option.
      $('select').change(function () {
        var value = '';
        var label = '';
        $('select option:selected').each(function () {
          label += $(this).text();
          value += $(this).val();
        });

        setUserResponse(label);
        send(value);
        $('.dropDownMsg').remove();
      });
    }

    //====================================== functions for drop-down menu of the bot  =========================================

    //restart function to restart the conversation.
    $('#restart').click(function () {
      restartConversation();
    });

    //clear function to clear the chat contents of the widget.
    $('#clear').click(function () {
      $('.chats').fadeOut('normal', function () {
        $('.chats').html('');
        $('.chats').fadeIn();
      });
    });

    //close function to close the widget.
    $('#close').click(function () {
      $('.profile_div').toggle();
      $('.widget').toggle();
      scrollToBottomOfResults();
    });

    //======================================bot typing animation ======================================
    function showBotTyping() {
      var botTyping =
        '<img class="botAvatar" id="botAvatar" src="./assets/img/sara_avatar.png"/><div class="botTyping">' +
        '<div class="bounce1"></div>' +
        '<div class="bounce2"></div>' +
        '<div class="bounce3"></div>' +
        '</div>';
      $(botTyping).appendTo('.chats');
      $('.botTyping').show();
      scrollToBottomOfResults();
    }

    function hideBotTyping() {
      $('#botAvatar').remove();
      $('.botTyping').remove();
    }
  }
}
