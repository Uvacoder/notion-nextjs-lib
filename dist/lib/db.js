// src/lib/db.ts
import { get, set } from "lodash";
import ogs from "open-graph-scraper";
import { getPlaiceholder } from "plaiceholder";

// src/helpers/helpers.ts
function cleanText(text) {
  if (!text)
    return void 0;
  return text.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
}

// src/lib/db.ts
async function getNotionDatabaseWithoutCache(dataId, notionToken, notionVersion, filter, startCursor, pageSize, sorts) {
  try {
    const url = `https://api.notion.com/v1/databases/${dataId}/query`;
    const requestBody = {
      filter,
      sorts,
      start_cursor: startCursor,
      page_size: pageSize ?? 50
    };
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${notionToken}`,
        "Notion-Version": notionVersion,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });
    return res.json();
  } catch (error) {
    console.error(error);
    const retryAfter = error?.response?.headers["retry-after"] || error["retry-after"];
    if (retryAfter) {
      console.log(`Retrying after ${retryAfter} seconds`);
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1e3 + 500));
      return await getNotionDatabaseWithoutCache(
        dataId,
        notionToken,
        notionVersion,
        filter,
        startCursor,
        pageSize,
        sorts
      );
    }
    return;
  }
}
var getNotionPageWithoutCache = async (pageId, notionToken, notionVersion) => {
  const url = `https://api.notion.com/v1/pages/${pageId}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${notionToken}`,
      "Notion-Version": notionVersion
    }
  });
  return res.json();
};
var getNotionBlocksWithoutCache = async (pageId, notionToken, notionVersion, pageSize, startCursor) => {
  let url = `https://api.notion.com/v1/blocks/${pageId}/children`;
  if (pageSize) {
    url += `?page_size=${pageSize}`;
    if (startCursor)
      url += `&start_cursor=${startCursor}`;
  } else if (startCursor)
    url += `?start_cursor=${startCursor}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${notionToken}`,
      "Notion-Version": notionVersion
    }
  });
  return res.json();
};
async function retrieveNotionDatabaseWithoutCache(dataId, notionToken, notionVersion) {
  const url = `https://api.notion.com/v1/databases/${dataId}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${notionToken}`,
      "Notion-Version": notionVersion
    }
  });
  return res.json();
}
async function getBlocks(blockId, notionToken, notionVersion, initNumbering, getPageUri, parseImgurUrl) {
  let data = await getNotionBlocksWithoutCache(blockId, notionToken, notionVersion);
  let blocks = data?.results;
  if (!blocks?.length)
    return [];
  if (data && data["has_more"]) {
    while (data["has_more"]) {
      const startCursor = data["next_cursor"];
      data = await getNotionBlocksWithoutCache(
        blockId,
        notionToken,
        notionVersion,
        void 0,
        startCursor
      );
      if (get(data, "results") && get(data, "results").length) {
        const lst = data["results"];
        blocks = [...blocks, ...lst];
      }
    }
  }
  let number = 1;
  for (const block of blocks) {
    if (block.type === "numbered_list_item") {
      if (initNumbering && ["1", "2", "3"].includes(initNumbering))
        initNumbering = void 0;
      block["list_item"] = (initNumbering ?? "") + `${number}.`;
      number++;
    } else {
      number = 1;
    }
    if (block.type === "bulleted_list_item") {
      block["list_item"] = !initNumbering ? "1" : initNumbering === "1" ? "2" : "3";
    }
    if (get(block, `${block.type}.rich_text`) && !!getPageUri) {
      const parsedMention = await parseMention(
        get(block, `${block.type}.rich_text`),
        getPageUri
      );
      set(block, `${block.type}.rich_text`, parsedMention);
    }
    if (block.has_children) {
      const children = await getBlocks(
        block.id,
        notionToken,
        notionVersion,
        block["list_item"],
        getPageUri,
        parseImgurUrl
      );
      block["children"] = children;
    }
    if (block.type === "image") {
      const url = get(block, "image.file.url") || get(block, "image.external.url");
      if (url) {
        if (parseImgurUrl)
          block["imgUrl"] = parseImgurUrl(url);
        block["imageInfo"] = await getPlaceholderImage(url);
      }
    }
    if (block.type === "bookmark") {
      const url = get(block, "bookmark.url");
      if (url) {
        const { result } = await ogs({ url });
        const bookmark = {
          url,
          title: cleanText(result.ogTitle),
          description: cleanText(result.ogDescription) ?? null,
          favicon: result.ogUrl + result.favicon.replace("/", ""),
          imageSrc: result.ogImage?.[0]?.url ?? null
        };
        block["bookmark"] = bookmark;
      }
    }
  }
  return blocks;
}
async function parseMention(richText, getPageUri) {
  if (!richText?.length)
    return [];
  const newRichText = [];
  for (const block of richText) {
    if (block.type === "mention" && block.mention?.type === "page") {
      const pageId = get(block, "mention.page.id");
      if (pageId) {
        const pageUri = await getPageUri(pageId);
        set(block, "mention.page.uri", pageUri);
      }
      newRichText.push(block);
    } else {
      newRichText.push(block);
    }
  }
  return newRichText;
}
var getPlaceholderImage = async function getPlaceholderImage2(src) {
  const res = await fetch(src);
  const arrayBuffer = await res.arrayBuffer();
  if (arrayBuffer.byteLength === 0)
    return { base64: "", width: 0, height: 0 };
  const buffer = await fetch(src).then(async (res2) => Buffer.from(await res2.arrayBuffer()));
  const { base64, metadata } = await getPlaiceholder(buffer);
  return { base64, width: metadata.width, height: metadata.height };
};
export {
  getBlocks,
  getNotionBlocksWithoutCache,
  getNotionDatabaseWithoutCache,
  getNotionPageWithoutCache,
  getPlaceholderImage,
  retrieveNotionDatabaseWithoutCache
};
//# sourceMappingURL=db.js.map