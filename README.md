# UI Search Bot

This is the code for the chatbot-based approach for retrieveing GUIs, UI Search Bot.

The tool has NGXS State Management for logging purposes: The initial search requests is logged by NGXS as type INITIAL. Incomming requests are logged in as ADDITIVE OR NEGATIVE depending on the type of implicit user feedback.
The NGXS state is managed in src/app/state, where the search requests are also forwarded to the Retrieval and Ranking Service. The proxy to the GUI Retrieval and Ranking API is specified in ./proxy.config.json.

The NGXS actions are defined in src/app/actions.

The proxy to the Rasa Server is established via a REST API call in the chatbot widget (./chatbot/chatbot.component.ts).

The processing of the search results to implicit search requests is done in src/app/ui-search-chatbot/ui-search-chatbot.component.ts.

## Run the project

To run the project locally, execute the command `ng serve` in the project location in a terminal. The local frontend server will be reachable on `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

When you load the app, click on the bird icon in the lower right corner to open the chat widget. Then, you can start writing requests for GUIs :) And maybe ask the bot to tell you a joke or two ;)

## View the state changes

To view the state changes in real-time while the user is making search requests with the tool, open the browser console (right click, "Inspect" and go to "Console"). You will see the current and next system state being logged by NGXS. The two states will be updated after each request (you need to scroll down the console to see the most recent changes).
The states will log the incomming search query and the retrieved and ranked GUIs.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
