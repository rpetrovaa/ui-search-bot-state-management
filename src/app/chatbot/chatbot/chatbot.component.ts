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
  state: RequestType;
  stateExt: RequestType;
  counter: number = 0;
  requestMoreScreens: any;

  constructor(
    private postRequestService: PostRequestService,
    private setStateService: SetStateService,
    private diffService: DiffService
  ) {
    if (!this.setStateService.request) return;
    this.setStateService.request.subscribe((request) => {
      this.request = request.postRequest;
      this.state = request.requestType;
    });

    if (!this.setStateService.requestNegative) return;
    this.setStateService.requestNegative.subscribe((requestNegative) => {
      this.requestNegative = requestNegative.postRequest;
      this.state = requestNegative.requestType;
    });

    if (!this.setStateService.requestExtended) return;
    this.setStateService.requestExtended.subscribe((requestExtended) => {
      this.requestExtended = requestExtended.postRequest;
      this.stateExt = requestExtended.requestType;
    });

    if (!this.setStateService.requestMoreScreens) return;
    this.setStateService.requestMoreScreens.subscribe((requestMoreScreens) => {
      this.requestMoreScreens = requestMoreScreens.postRequest;
      this.state = requestMoreScreens.requestType;
    });

    if (!this.diffService.diff) return;
    this.diff = this.diffService.getDifference();
    // this.diffService.diff.subscribe((diff) => {
    //   this.diff = diff;
    // });

    this.lastQuery$.subscribe((results) => (this.lastResults = results));
  }

  ngOnInit() {
    //initialization
    //$(document).ready(function() {
    let postRequestService = this.postRequestService;
    let setStateServiceLocal = this.setStateService;
    //let diff = this.diff;
    let diffServiceLocal = this.diffService;
    // console.log('set state service in global scope', setStateServiceLocal);

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
    let user_id = 'radost';
    let requestGlobal = this.request;
    let messageGlobal = this.message;
    let requestGlobalNegatve = this.requestNegative;
    let requestGlobalExtended = this.requestExtended;
    let stateGlobal = this.state;
    let stateExtGLobal = this.stateExt;
    let counterGlobal = this.counter;
    let askedGlobal = false;

    //if you want the bot to start the conversation
    // action_trigger();

    //})

    // ========================== restart conversation ========================
    function restartConversation() {
      $('#userInput').prop('disabled', true);
      //destroy the existing chart
      $('.collapsible').remove();

      $('.chart-container').remove();
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

          $('.chart-container').remove();
          //if (typeof modalChart !== 'undefined') { modalChart.destroy(); }

          $('#paginated_cards').remove();
          $('.suggestions').remove();
          $('.quickReplies').remove();
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
        url: 'http://localhost:5005/webhooks/rest/webhook',
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

            setBotResponse('Restarting the conversation.');

            //if you want the bot to start the conversation after restart
            // action_trigger();
            return;
          }

          messageGlobal = message;

          // if (stateGlobal !== undefined && !messageGlobal.includes('yes')) {
          //   stateGlobal = RequestType.ADDITIVE;
          // } else {
          //   stateGlobal = RequestType.INITIAL;
          // }

          if (
            botResponse !== undefined &&
            botResponse[0].text == 'What other screens would you like to have?'
          ) {
            if (message.includes('yes')) {
              counterGlobal = 0;
              // console.log('RESETTING COUNTER');
            }
          }

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
      console.log('checking this.request', requestGlobal);

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

            //check if the response contains "buttons"
            if (response[i].hasOwnProperty('buttons')) {
              addSuggestion(response[i].buttons);
            }

            //check if the response contains "custom" message
            if (response[i].hasOwnProperty('custom')) {
              //check if the custom payload type is "quickReplies"
              if (response[i].custom.payload == 'quickReplies') {
                const quickRepliesData = response[i].custom.data;
                showQuickReplies(quickRepliesData);
                return;
              }

              //check if the custom payload type is "dropDown"
              if (response[i].custom.payload == 'dropDown') {
                const dropDownData = response[i].custom.data;
                renderDropDwon(dropDownData);
                return;
              }

              // //check of the custom payload type is "query"
              // if (response[i].custom.payload == 'query') {
              //   // console.log(
              //   //   'inside response is there slot?:',
              //   //   response[i].custom
              //   // );
              //   if (!messageGlobal) {
              //     // console.log('messageGlobal still undefined and returning');
              //     return;
              //   }

              //   let slot_value = response[i].custom.data.text.query;

              //   if (!slot_value) {
              //     // console.log('slot value is undefined');
              //     requestGlobal = postRequestService.createPostRequest(
              //       messageGlobal
              //     );
              //   } else {
              //     requestGlobal = postRequestService.createPostRequest(
              //       slot_value
              //     );
              //   }

              //   if (!requestGlobal) {
              //     // console.log('still undefined and returning');
              //     return;
              //   }

              //   // console.log('state global', stateGlobal);
              //   if (counterGlobal === 0) {
              //     stateGlobal = RequestType.INITIAL;
              //     counterGlobal += 1;
              //   } else {
              //     stateGlobal = RequestType.ADDITIVE;
              //     counterGlobal += 1;
              //   }

              //   let addQuery = setStateServiceLocal.setAction(
              //     requestGlobal,
              //     stateGlobal
              //   );
              //   // console.log(
              //   //   'set state service in local scope',
              //   //   setStateServiceLocal,
              //   //   addQuery
              //   // );

              //   if (!slot_value) {
              //     var BotResponse =
              //       '<img class="botAvatar" src="./assets/img/sara_avatar.png"/><p class="botMsg">' +
              //       'Here are your results.' +
              //       '</p><div class="clearfix"></div>';
              //     $(BotResponse).appendTo('.chats').hide().fadeIn(1000);
              //   } else {
              //     var BotResponse =
              //       '<img class="botAvatar" src="./assets/img/sara_avatar.png"/><p class="botMsg">' +
              //       'Here are your ' +
              //       slot_value +
              //       ' results.' +
              //       '</p><div class="clearfix"></div>';
              //     $(BotResponse).appendTo('.chats').hide().fadeIn(1000);
              //   }
              // }

              //check of the custom payload type is "query_extended"
              if (response[i].custom.payload == 'query_extended') {
                // console.log(
                //   'inside response is there slot?:',
                //   response[i].custom
                // );
                if (!messageGlobal) {
                  // console.log('messageGlobal still undefined and returning');
                  return;
                }

                let slot_value = response[i].custom.data.text.query;

                if (!slot_value) {
                  // console.log('slot value is undefined');
                  requestGlobalExtended = postRequestService.createPostRequest(
                    messageGlobal
                  );
                } else {
                  requestGlobalExtended = postRequestService.createPostRequest(
                    slot_value
                  );
                }

                if (!requestGlobalExtended) {
                  // console.log('still undefined and returning');
                  return;
                }

                var BotResponse = '';

                if (counterGlobal === 0) {
                  stateGlobal = RequestType.INITIAL;
                  // counterGlobal += 1;
                  BotResponse =
                    '<img class="botAvatar" src="./assets/img/sara_avatar.png"/><p class="botMsg">' +
                    'Here are your ' +
                    slot_value +
                    ' results.' +
                    '</p><div class="clearfix"></div>';
                  $(BotResponse).appendTo('.chats').hide().fadeIn(1000);
                } else {
                  stateGlobal = RequestType.ADDITIVE;
                  // counterGlobal += 1;
                  BotResponse =
                    '<img class="botAvatar" src="./assets/img/sara_avatar.png"/><p class="botMsg">' +
                    'Here are your results with ' +
                    slot_value +
                    '.' +
                    '</p><div class="clearfix"></div>';
                  $(BotResponse).appendTo('.chats').hide().fadeIn(1000);
                }

                stateExtGLobal = RequestType.ADDITIVE;

                let addQueryExtended = setStateServiceLocal.setActionExtended(
                  requestGlobalExtended,
                  stateGlobal,
                  counterGlobal
                );
                // console.log(
                //   'set state service in local scope',
                //   setStateServiceLocal,
                //   addQueryNegative
                // );

                //CONTINUE FROM HERE. YOU NEED TO IMPLEMENT THE SET DIFFERENCE NOW

                let diff = diffServiceLocal.getDifference();
                // console.log('DIFF in BOt Comp', diff);

                if (diff !== null && diff.length < 0) {
                  // console.log('IN INTERSECT BLOCK');
                  BotResponse =
                    '<img class="botAvatar" src="./assets/img/sara_avatar.png"/><p class="botMsg">' +
                    'There are no results corresponding to your request.' +
                    '</p><div class="clearfix"></div>';
                  $(BotResponse).appendTo('.chats').hide().fadeIn(1000);
                }

                counterGlobal += 1;

                // else if (counterGlobal === 0) {
                //   var BotResponse =
                //     '<img class="botAvatar" src="./assets/img/sara_avatar.png"/><p class="botMsg">' +
                //     'Here are your results.' +
                //     '</p><div class="clearfix"></div>';
                //   $(BotResponse).appendTo('.chats').hide().fadeIn(1000);
                // } else {
                //   var BotResponse =
                //     '<img class="botAvatar" src="./assets/img/sara_avatar.png"/><p class="botMsg">' +
                //     'Here are your results with ' +
                //     slot_value +
                //     '.' +
                //     '</p><div class="clearfix"></div>';
                //   $(BotResponse).appendTo('.chats').hide().fadeIn(1000);
                // }
              }

              //check of the custom payload type is "query_negative"
              if (response[i].custom.payload == 'query_negative') {
                // console.log(
                //   'inside response is there slot?:',
                //   response[i].custom
                // );
                // console.log('just the response:', response[i]);
                if (!messageGlobal) {
                  // console.log('messageGlobal still undefined and returning');
                  return;
                }

                let slot_value = response[i].custom.data.text.query;

                if (!slot_value) {
                  // console.log('slot value is undefined');
                  requestGlobalNegatve = postRequestService.createPostRequest(
                    messageGlobal
                  );
                } else {
                  requestGlobalNegatve = postRequestService.createPostRequest(
                    slot_value
                  );
                }

                if (!requestGlobalNegatve) {
                  // console.log('still undefined and returning');
                  return;
                }

                stateGlobal = RequestType.NEGATIVE;

                let addQueryNegative = setStateServiceLocal.setActionNegative(
                  requestGlobalNegatve,
                  stateGlobal,
                  counterGlobal
                );
                // console.log(
                //   'set state service in local scope',
                //   setStateServiceLocal,
                //   addQueryNegative
                // );

                counterGlobal += 1;

                let diff = diffServiceLocal.getDifference();

                //CONTINUE FROM HERE. YOU NEED TO IMPLEMENT THE SET DIFFERENCE NOW
                // if (!diff) return;

                if (diff != null && diff.length < 1) {
                  // console.log('IN DIFF BLOCK');
                  var BotResponse =
                    '<img class="botAvatar" src="./assets/img/sara_avatar.png"/><p class="botMsg">' +
                    'There are no results corresponding to your request.' +
                    '</p><div class="clearfix"></div>';
                  $(BotResponse).appendTo('.chats').hide().fadeIn(1000);
                } else {
                  var BotResponse =
                    '<img class="botAvatar" src="./assets/img/sara_avatar.png"/><p class="botMsg">' +
                    'Here are your results without ' +
                    slot_value +
                    '.' +
                    '</p><div class="clearfix"></div>';
                  $(BotResponse).appendTo('.chats').hide().fadeIn(1000);
                }
              }

              //check of the custom payload type is "query_negative"
              if (response[i].custom.payload == 'more_screens') {
                // console.log(
                //   'inside response is there slot?:',
                //   response[i].custom
                // );
                // console.log('just the response:', response[i]);
                console.log('in chatbot accessing more screens');

                stateGlobal = RequestType.ADDITIVE;

                setStateServiceLocal.setActionMoreScreens(
                  null,
                  stateGlobal,
                  counterGlobal
                );
                // console.log(
                //   'set state service in local scope',
                //   setStateServiceLocal,
                //   addQueryNegative
                // );

                setStateServiceLocal.requestMoreScreens.subscribe((request) =>
                  console.log('in chatbot', request)
                );

                counterGlobal += 1;
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

    //====================================== Suggestions ===========================================

    function addSuggestion(textToAdd) {
      setTimeout(function () {
        var suggestions = textToAdd;
        var suggLength = textToAdd.length;
        $(
          ' <div class="singleCard"> <div class="suggestions"><div class="menu"></div></div></diV>'
        )
          .appendTo('.chats')
          .hide()
          .fadeIn(1000);
        // Loop through suggestions
        for (let i = 0; i < suggLength; i++) {
          $(
            '<div class="menuChips" data-payload=\'' +
              suggestions[i].payload +
              "'>" +
              suggestions[i].title +
              '</div>'
          ).appendTo('.menu');
        }
        scrollToBottomOfResults();
      }, 1000);
    }

    // on click of suggestions, get the value and send to rasa
    $(document).on('click', '.menu .menuChips', function () {
      var text = this.innerText;
      var payload = this.getAttribute('data-payload');
      console.log('payload: ', this.getAttribute('data-payload'));
      setUserResponse(text);
      send(payload);

      //delete the suggestions once user click on it
      $('.suggestions').remove();
    });

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

    function createCardsCarousel(cardsData) {
      var cards = '';

      for (let i = 0; i < cardsData.length; i++) {
        const title = cardsData[i].name;
        const ratings = Math.round((cardsData[i].ratings / 5) * 100) + '%';
        const data = cardsData[i];
        const item =
          '<div class="carousel_cards in-left">' +
          '<img class="cardBackgroundImage" src="' +
          cardsData[i].image +
          '"><div class="cardFooter">' +
          '<span class="cardTitle" title="' +
          title +
          '">' +
          title +
          '</span> ' +
          '<div class="cardDescription">' +
          '<div class="stars-outer">' +
          '<div class="stars-inner" style="width:' +
          ratings +
          '" ></div>' +
          '</div>' +
          '</div>' +
          '</div>' +
          '</div>';

        cards += item;
      }

      var cardContents =
        '<div id="paginated_cards" class="cards"> <div class="cards_scroller">' +
        cards +
        '  <span class="arrow prev fa fa-chevron-circle-left "></span> <span class="arrow next fa fa-chevron-circle-right" ></span> </div> </div>';

      return cardContents;
    }

    //====================================== Quick Replies ==================================================

    function showQuickReplies(quickRepliesData) {
      var chips = '';
      for (let i = 0; i < quickRepliesData.length; i++) {
        var chip =
          '<div class="chip" data-payload=\'' +
          quickRepliesData[i].payload +
          "'>" +
          quickRepliesData[i].title +
          '</div>';
        chips += chip;
      }

      var quickReplies =
        '<div class="quickReplies">' +
        chips +
        '</div><div class="clearfix"></div>';
      $(quickReplies).appendTo('.chats').fadeIn(1000);
      scrollToBottomOfResults();
      const slider = document.querySelector('.quickReplies') as HTMLElement;
      let isDown = false;
      let startX;
      let scrollLeft;

      slider.addEventListener('mousedown', (e: MouseEvent) => {
        isDown = true;
        slider.classList.add('active');
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
      });
      slider.addEventListener('mouseleave', () => {
        isDown = false;
        slider.classList.remove('active');
      });
      slider.addEventListener('mouseup', () => {
        isDown = false;
        slider.classList.remove('active');
      });
      slider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 3; //scroll-fast
        slider.scrollLeft = scrollLeft - walk;
      });
    }

    // on click of quickreplies, get the value and send to rasa
    $(document).on('click', '.quickReplies .chip', function () {
      var text = this.innerText;
      var payload = this.getAttribute('data-payload');
      console.log('chip payload: ', this.getAttribute('data-payload'));
      setUserResponse(text);
      send(payload);

      //delete the quickreplies
      $('.quickReplies').remove();
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
