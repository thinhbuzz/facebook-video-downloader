document.addEventListener('DOMContentLoaded', () => {
  (popup)().catch(console.error);
});
async function popup() {
  const container = document.querySelector('.container');

  const toolContainer = container.querySelector('.tools');

  const textMessageContainer = container.querySelector('.message');
  const textMessage = textMessageContainer.querySelector('.message-text');

  const videoTableContainer = container.querySelector('.video-table');
  const videoTableContent = videoTableContainer.querySelector('.table-content');

  document.querySelectorAll('[data-locale]').forEach(elem => {
    elem.innerText = chrome.i18n.getMessage(elem.dataset.locale);
  });

  function getCurrentTab() {
    return new Promise((resolve) => {
      return chrome.tabs.query(
        {active: true, currentWindow: true},
        (tabs) => resolve(tabs[0])
      );
    });
  }

  function toggleDisplay(element, isShow) {
    element.classList[isShow ? 'remove' : 'add']('hidden');
  }

  function showMessage(message, isError) {
    textMessage.textContent = message;
    textMessage.classList[isError ? 'add' : 'remove']('error');
    toggleDisplay(textMessageContainer, true);
  }

  function appendVideo(video) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>
    <video class="video-preview" controls>
      <source src="${video.link}" type="video/mp4" />
      ${chrome.i18n.getMessage('html5VideoNotSupport')}
    </video>
  </td>
  <td><span>${video.quality}</span></td>
  <td></td>`;
    const downloadCell = tr.lastElementChild;
    const downloadButton = document.createElement('button');
    downloadButton.setAttribute('type', 'button');
    downloadButton.textContent = chrome.i18n.getMessage('download');
    downloadButton.addEventListener('click', () => {
      chrome.downloads.download({url: video.link});
    });
    downloadCell.appendChild(downloadButton);
    videoTableContent.appendChild(tr);
  }

  function handleResponse(response) {
    if (!response) {
      return showMessage(chrome.i18n.getMessage('videoNotFound'));
    }
    const {error, videos} = response;
    if (error) {
      return showMessage(error);
    }
    toggleDisplay(textMessageContainer, false);

    videos.forEach((video) => appendVideo(video));
  }

  async function dispatchFetchVideos() {
    videoTableContent.innerHTML = '';
    showMessage(chrome.i18n.getMessage('videoFetching'), false);
    const tab = await getCurrentTab();

    chrome.tabs.sendMessage(
      tab.id,
      {from: 'popup', subject: 'getVideos'},
      handleResponse
    );
  }

  const fetchingButton = document.createElement('button');
  fetchingButton.setAttribute('type', 'button');
  fetchingButton.textContent = chrome.i18n.getMessage('fetching');
  fetchingButton.addEventListener('click', () => {
    dispatchFetchVideos().catch(console.error);
  });
  toolContainer.appendChild(fetchingButton);

  dispatchFetchVideos().catch(console.error);

}
