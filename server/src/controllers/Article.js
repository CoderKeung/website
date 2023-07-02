import Fs from "fs"
import { DOCXSDIR, STYLEPATH } from "../config.js"
import Axios from "axios"
import { load } from "cheerio"
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  HorizontalPositionRelativeFrom,
  HorizontalPositionAlign,
  VerticalPositionRelativeFrom,
  VerticalPositionAlign,
  TextWrappingType,
  TextWrappingSide,
} from "docx"

class ExtractArticle {
  URL = "";
  DOMAIN = "";
  isJianPian = false;

  constructor(url) {
    this.URL = url;
    this.DOMAIN = this.URL.split("/")[2];
    this.isJianPian = this.DOMAIN === "www.jianpian.cn" ? true : false;
  }
  /**
   * @description 截取目标字符串中指定开始字符和结束字符的内容
   * @param target 目标字符串
   * @param start 开始字符串
   * @param end 结束字符串
   * @returns result 截取后的字符串
   */
  #extracttextandreturnremainder( target, start, end ) {
    let result = target.substring(
      target.search(start) + start.length,
      target.search(end),
    );
    result = result.substring(0, result.lastIndexOf(";"));
    return result;
  }
  #isHtml(string) {
    const reg = /<[^>]+>/g;
    return reg.test(string);
  }
  #extractTextInHtml(string) {
    return this.#isHtml(string) ? string.replace(/<[^>]+>/g, "") : string;
  }
  /**
   * @description 通过 URL 提取 json 内容
   * @returns jsondata
   */
  #extractjson() {
    const jsondata = Axios.get(this.URL).then((webdata) => {
      let start;
      let end;
      if (this.isJianPian) {
        start = "window.__initial_state__= ", end = "function";
      } else {
        start = "var article_detail = ", end = "var detail = ";
      }
      return JSON.parse(
        this.#extracttextandreturnremainder(
          load(webdata.data)("script").text(),
          start,
          end,
        )
      );
    });
    return jsondata;
  }

  #getArticle(content, article, author){
    let contentData = [];
    Object.entries(content).forEach(([_, value]) => {
      let contentBlock = { type: value.type };
      if (value.text) contentBlock.text = this.#extractTextInHtml(value.text);
      if (value.img_url) {
        contentBlock.image = {
          url: value.img_url,
          height: value.img_height,
          width: value.img_width,
        };
      }
      if (value.video_url) {
        contentBlock.video = {
          url: value.video_url,
          length: value.video_length,
        };
      }
      if (value.address) {
        contentBlock.address = {
          address: value.address,
          title: value.title,
          latitude: value.latitude,
          longitude: value.longitude,
        };
      }
      if (value.audio_url) {
        contentBlock.audio = {
          url: value.audio_url,
          name: value.audio_name,
        };
      }
      contentData.push(contentBlock);
    });

    return {
      id: article.mask_id,
      title: article.title,
      author: {
        id: author.id,
        name: author.nickname,
      },
      content: contentData,
    };
  }
  /**
   * @description 通过 json 内容创建我需要的文章 json
   * @returns articleJsonObject
   */
  async createArticle() {
    const jsondata = await this.#extractjson();
    if (this.isJianPian) {
      return this.#getArticle(jsondata.detail.article.content, jsondata.detail.article, jsondata.users.author)
    } else {
      return this.#getArticle(jsondata.content, jsondata.article, jsondata.author)
    }
  }
}

class CreateDocx {
  ARTICLE = {};

  constructor(article) {
    this.ARTICLE = article;
  }
  /**
   * @description 根据图片链接下载图片
   * @param imageUrl 图片链接
   * @returns Buffer
   */
  async #downloadImage(imageUrl) {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    console.log("下载", blob.size);
    return blob.arrayBuffer();
  }
  async #initializationParagraphsConstant() {
    const decoder = new TextDecoder("utf-8");
    const data = Fs.readFileSync(STYLEPATH);
    const paragraphs = [
      new Paragraph({
        children: [new TextRun(this.ARTICLE.title)],
        style: "GWH",
      }),
      new Paragraph({
        children: [new TextRun(this.ARTICLE.author.name)],
        style: "GWT",
      }),
    ];
    for (const contentBlock of this.ARTICLE.content) {
      let paragraphsChildren = [];
      let style = "";
      if (contentBlock.text) {
        if (contentBlock.type === 6) {
          style = "GWT";
        } else {
          style = "GWP";
        }
        paragraphsChildren = [new TextRun(contentBlock.text)];
      }
      if (contentBlock.image) {
        const buffer = await this.#downloadImage(contentBlock.image.url);
        paragraphsChildren = [
          new ImageRun({
            data: buffer,
            transformation: {
              width: 600,
              height: ((600 / contentBlock.image?.width) *
                  contentBlock.image?.height) > 1000
                ? 600
                : ((600 / contentBlock.image?.width) *
                  contentBlock.image?.height),
            },
            floating: {
              horizontalPosition: {
                relative: HorizontalPositionRelativeFrom.PAGE,
                align: HorizontalPositionAlign.CENTER,
              },
              verticalPosition: {
                relative: VerticalPositionRelativeFrom.PARAGRAPH,
                align: VerticalPositionAlign.CENTER,
              },
              wrap: {
                type: TextWrappingType.TOP_AND_BOTTOM,
                side: TextWrappingSide.BOTH_SIDES,
              },
            },
          }),
        ];
      }
      paragraphs.push(
        new Paragraph({
          children: paragraphsChildren,
          style: style,
        }),
      );
    }
    return new Document({
      externalStyles: decoder.decode(data),
      sections: [{
        properties: {
          page: {
            margin: {
              top: "3cm",
              bottom: "2.5cm",
              right: "2.5cm",
              left: "2.5cm",
            },
          },
        },
        children: paragraphs,
      }],
    });
  }
  async create(docxname) {
    await this.#initializationParagraphsConstant().then(async (docx) => {
      const buffer = await Packer.toBuffer(docx);
      if (!Fs.existsSync(DOCXSDIR)) {
        Fs.mkdirSync(DOCXSDIR)
      }
      Fs.writeFileSync(DOCXSDIR + docxname + ".docx", buffer);
    });
    return true
  }
}

export async function Conversion(req, res) {
  if( req.body.url ) {
    const article = await new ExtractArticle(req.body.url).createArticle()
    await new CreateDocx(article).create(article.title)
    res.json(article)
  } else {
    res.send("NO")
  }
}