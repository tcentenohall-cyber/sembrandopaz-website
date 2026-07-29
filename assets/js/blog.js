/**
 * Sembrandopaz blog integration.
 *
 * Renders posts from the public Sembrandopaz WordPress.com blog
 * (https://sembrandopazcolombia.wordpress.com/) directly on this site,
 * using WordPress.com's public REST API. This is read-only: no login,
 * no posting. Editors keep publishing from wordpress.com as usual —
 * new posts just show up here automatically.
 *
 * Docs: https://developer.wordpress.com/docs/api/
 */
(function () {
  'use strict';

  var WP_SITE = 'sembrandopazcolombia.wordpress.com';
  var WP_API = 'https://public-api.wordpress.com/rest/v1.1/sites/' + WP_SITE;
  var POSTS_PER_PAGE = 9;

  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return '';
    }
  }

  function stripTags(html) {
    var div = document.createElement('div');
    div.innerHTML = html || '';
    return (div.textContent || div.innerText || '').trim();
  }

  function firstImageFromHTML(html) {
    if (!html) return null;
    var match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    return match ? match[1] : null;
  }

  function postImage(post) {
    if (post.featured_image) return post.featured_image;
    if (post.post_thumbnail && post.post_thumbnail.URL) return post.post_thumbnail.URL;
    var fromContent = firstImageFromHTML(post.content) || firstImageFromHTML(post.excerpt);
    if (fromContent) return fromContent;
    return null;
  }

  function fetchJSON(url) {
    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error('Request failed: ' + res.status);
      return res.json();
    });
  }

  /* ---------------------------------------------------------------- */
  /* Listing page (blog/index.html)                                    */
  /* ---------------------------------------------------------------- */

  function initBlogList() {
    var grid = document.getElementById('blog-grid');
    var status = document.getElementById('blog-status');
    var loadMoreBtn = document.getElementById('blog-load-more');
    if (!grid || !status) return;

    var offset = 0;
    var totalFound = null;

    function renderPosts(posts) {
      posts.forEach(function (post) {
        var card = document.createElement('a');
        card.className = 'blog-card';
        card.href = 'post.html?slug=' + encodeURIComponent(post.slug);

        var media = document.createElement('div');
        media.className = 'blog-card-media';
        var img = postImage(post);
        if (img) {
          var imgEl = document.createElement('img');
          imgEl.src = img;
          imgEl.alt = '';
          imgEl.loading = 'lazy';
          media.appendChild(imgEl);
        } else {
          media.classList.add('blog-card-media--placeholder');
        }
        card.appendChild(media);

        var body = document.createElement('div');
        body.className = 'blog-card-body';

        var date = document.createElement('span');
        date.className = 'blog-card-date';
        date.textContent = formatDate(post.date);
        body.appendChild(date);

        var title = document.createElement('h3');
        title.textContent = stripTags(post.title);
        body.appendChild(title);

        var excerpt = document.createElement('p');
        excerpt.textContent = stripTags(post.excerpt);
        body.appendChild(excerpt);

        var readMore = document.createElement('span');
        readMore.className = 'blog-card-link';
        readMore.innerHTML = 'Read more <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>';
        body.appendChild(readMore);

        card.appendChild(body);
        grid.appendChild(card);
      });
    }

    function loadPage() {
      loadMoreBtn.disabled = true;
      var url = WP_API + '/posts/?number=' + POSTS_PER_PAGE + '&offset=' + offset +
        '&fields=ID,title,excerpt,slug,date,featured_image,post_thumbnail,content';

      fetchJSON(url)
        .then(function (data) {
          var posts = data.posts || [];
          totalFound = typeof data.found === 'number' ? data.found : totalFound;

          if (offset === 0 && posts.length === 0) {
            status.textContent = 'No posts yet — check back soon.';
            return;
          }

          status.hidden = true;
          grid.hidden = false;
          renderPosts(posts);
          offset += posts.length;

          var hasMore = totalFound === null ? posts.length === POSTS_PER_PAGE : offset < totalFound;
          loadMoreBtn.hidden = !hasMore;
          loadMoreBtn.disabled = false;
        })
        .catch(function (err) {
          console.error('Sembrandopaz blog: failed to load posts', err);
          status.textContent = 'We couldn\u2019t load the blog right now. Please try again later, or visit it directly on WordPress.';
        });
    }

    loadMoreBtn.addEventListener('click', loadPage);
    loadPage();
  }

  /* ---------------------------------------------------------------- */
  /* Single post page (blog/post.html)                                 */
  /* ---------------------------------------------------------------- */

  function initBlogPost() {
    var article = document.getElementById('blog-post');
    var status = document.getElementById('blog-post-status');
    if (!article || !status) return;

    var params = new URLSearchParams(window.location.search);
    var slug = params.get('slug');

    if (!slug) {
      status.textContent = 'No post specified.';
      return;
    }

    var url = WP_API + '/posts/slug:' + encodeURIComponent(slug);

    fetchJSON(url)
      .then(function (post) {
        var titleText = stripTags(post.title);
        document.getElementById('blog-post-title').textContent = titleText + ' — Sembrandopaz Blog';

        var dateEl = document.createElement('p');
        dateEl.className = 'blog-post-date';
        dateEl.textContent = formatDate(post.date) + (post.author && post.author.name ? ' \u00b7 ' + post.author.name : '');

        var titleEl = document.createElement('h1');
        titleEl.textContent = titleText;

        var img = postImage(post);
        var content = document.createElement('div');
        content.className = 'blog-post-content';
        content.innerHTML = post.content || '';

        article.appendChild(titleEl);
        article.appendChild(dateEl);
        if (img) {
          var figure = document.createElement('img');
          figure.className = 'blog-post-hero-image';
          figure.src = img;
          figure.alt = '';
          article.appendChild(figure);
        }
        article.appendChild(content);

        status.hidden = true;
        article.hidden = false;
      })
      .catch(function (err) {
        console.error('Sembrandopaz blog: failed to load post', err);
        status.textContent = 'We couldn\u2019t load this post right now. Please try again later.';
      });
  }

  if (document.getElementById('blog-grid')) {
    initBlogList();
  }
  if (document.getElementById('blog-post')) {
    initBlogPost();
  }
})();
