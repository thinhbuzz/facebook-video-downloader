function getVideos() {
  const keys = [
    'hd_src_no_ratelimit',
    'hd_src',
    'sd_src_no_ratelimit',
    'sd_src'
  ];
  const regExp = new RegExp(`(${keys.join('|')}):\s*"([^"]+)"`, 'g');
  const scriptTags = Array.from(
    document.body.querySelectorAll('script[nonce]')
  )
    .filter((tag) => {
      return (
        tag.textContent.indexOf('hd_src') !== -1 ||
        tag.textContent.indexOf('sd_src') !== -1
      );
    });
  if (!scriptTags.length) {
    return [];
  }
  const rawLinks = scriptTags.map(scriptTag => scriptTag.textContent.match(regExp) || [])
    .reduce((previousValue, currentValue) => previousValue.concat(currentValue), []);
  if (!rawLinks.length) {
    return [];
  }
  return Array.from(rawLinks)
    .map((item) => {
      const [, quality, link] = item.match(/(.*):"([^"]+)"/) || [];
      return {quality, link};
    })
    .sort((a, b) => a.quality.localeCompare(b.quality));
}

chrome.runtime.onMessage.addListener((msg, sender, response) => {
  if (msg.from === 'popup' && msg.subject === 'getVideos') {
    const videos = getVideos();
    if (!videos || videos.length === 0) {
      response({
        videos: [],
        error:
          chrome.i18n.getMessage("videoNotFound")
      });
      return;
    }

    response({
      videos,
      error: null
    });
  }
});
