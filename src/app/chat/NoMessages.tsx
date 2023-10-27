export const NoMessages = () => (
  <div class="text-sky-12 bg-sky-2 p-6 px-8 border(y-1 sky-6)">
    <strong>The conversation is empty.</strong>
    <ul class="list-disc mt-2 ml-4">
      <li>Select model in the bottom left corner.</li>
      <li>Use the input below to start chatting.</li>
      <li>
        Use the list on the left to load a previous chat.
        <br />
        (hidden if the window size is too small)
      </li>
      <li>You can type multi-line messages with Shift+Enter.</li>
      <li>
        Double click on a message to edit it, or for <strong>partial completion</strong>.
      </li>
      <li>You can also change the system-prompt at the top by double clicking it.</li>
    </ul>
  </div>
)
