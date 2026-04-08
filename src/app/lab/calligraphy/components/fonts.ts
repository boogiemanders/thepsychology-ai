export interface CalligraphyFont {
  label: string
  family: string
  file: string
  format: 'truetype' | 'opentype'
  style: 'brush' | 'pen'
  note?: string
}

export interface FontGroup {
  key: 'brush' | 'pen'
  label: string
  note: string
}

export const FONT_GROUPS: FontGroup[] = [
  { key: 'brush', label: 'Brush \u6bdb\u7b14', note: 'Thick, expressive brush strokes' },
  { key: 'pen', label: 'Pen \u786c\u7b14', note: 'Thin, refined pen strokes' },
]

export const FONTS: CalligraphyFont[] = [
  // Brush
  { label: 'Sun GuoTing ShuPu', family: 'SunGuoTingShuPu', file: '\u5b59\u8fc7\u5ead\u4e66\u8c31\u4f53.ttf', format: 'truetype', style: 'brush', note: 'Limited charset \u2014 classical text only' },
  { label: 'ZhiMang Xing', family: 'ZhiMangXing', file: 'ZhiMangXing-Regular.ttf', format: 'truetype', style: 'brush' },
  { label: 'SuXin ShiShuBiao', family: 'SuXinShiShuBiao', file: 'SuXinShiShuBiaoXingShuJian-1.ttf', format: 'truetype', style: 'brush' },
  { label: 'XiaoDouDao MoMoZhi', family: 'XiaoDouDaoMoMoZhi', file: 'XiaoDouDaoMoMoZhiCaoShuJian-2.otf', format: 'opentype', style: 'brush' },
  { label: 'Li XuKe ShuFa', family: 'LiXuKeShuFa', file: '\u674e\u65ed\u79d1\u4e66\u6cd51.4.ttf', format: 'truetype', style: 'brush' },
  { label: 'HanCheng WangShiLi XingShu', family: 'HanChengWangShiLiXingShu', file: 'HanChengWangShiLiXingShu-2.ttf', format: 'truetype', style: 'brush' },
  { label: 'ZiXiaoHun FengYi ShouShu', family: 'ZiXiaoHunFengYiShouShu', file: 'ZiXiaoHunFengYiShouShu.ttf', format: 'truetype', style: 'brush' },
  { label: 'CaoTanZhai Mao ZeDong', family: 'CaoTanZhaiMaoZeDong', file: 'CaoTanZhaiMaoZeDong.ttf', format: 'truetype', style: 'brush' },
  { label: 'DuanNing MaoBi XingShu', family: 'DuanNingMaoBiXingShu', file: 'DuanNingMaoBiXingShu.ttf', format: 'truetype', style: 'brush' },
  { label: 'MiNi Fan ZhiCao', family: 'MiNiFanZhiCao', file: 'MiNiFanZhiCao.ttf', format: 'truetype', style: 'brush' },
  { label: 'ZhongQi LiQuan CaoShu', family: 'ZhongQiLiQuanCaoShu', file: 'ZhongQiLiQuanCaoShu.ttf', format: 'truetype', style: 'brush' },
  { label: 'ShuTiFang Deng XiaoPing', family: 'ShuTiFangDengXiaoPing', file: 'ShuTiFangDengXiaoPing.ttf', format: 'truetype', style: 'brush' },
  { label: 'FangZheng XingTi CaoShu', family: 'FangZhengXingTiCaoShu', file: 'FangZhengXingTiCaoShu.ttf', format: 'truetype', style: 'brush' },
  { label: 'FangZheng XingTi CaoShu Jian', family: 'FangZhengXingTiCaoShuJian', file: 'FangZhengXingTiCaoShuJian.ttf', format: 'truetype', style: 'brush' },
  // Pen
  { label: 'ZhangYu XiaoRouWan', family: 'ZhangYuXiaoRouWan', file: 'ZhangYuXiaoRouWan-2.ttf', format: 'truetype', style: 'pen' },
  { label: 'YingZhang XingShu', family: 'YingZhangXingShu', file: '\u82f1\u7ae0\u884c\u4e66.ttf', format: 'truetype', style: 'pen' },
  { label: 'TianWei LiangNiWeiXiao', family: 'TianWeiLiangNiWeiXiao', file: 'TianWeiLiangNiWeiXiao-2.ttf', format: 'truetype', style: 'pen' },
  { label: 'XiaoDouDao QiuRiHeJianFan', family: 'XiaoDouDaoQiuRiHeJianFan', file: 'XiaoDouDaoQiuRiHeJianFan-Shan(REEJI-Xiaodou-AutumnGBT-Flash)-2.ttf', format: 'truetype', style: 'pen' },
  { label: 'Li GuoFu', family: 'LiGuoFu', file: '\u674e\u56fd\u592b\u624b\u5199\u5b57\u4f53.TTF', format: 'truetype', style: 'pen' },
  { label: 'HanCheng BoBo YingCao', family: 'HanChengBoBoYingCao', file: '\u6c49\u5448\u6ce2\u6ce2\u786c\u8349.ttf', format: 'truetype', style: 'pen' },
  { label: 'YuWei ShuFa XingShu', family: 'YuWeiShuFaXingShuJianTi', file: 'YuWeiShuFaXingShuJianTi-1.ttf', format: 'truetype', style: 'pen' },
  { label: 'ChenJiShi XingKai', family: 'ChenJiShiXingKai', file: 'ChenJiShiXingKai.ttf', format: 'truetype', style: 'pen' },
  { label: 'ShangShou HongZhi', family: 'ShangShouHongZhi', file: 'No.104-ShangShouHongZhiShouXieTi-2.ttf', format: 'truetype', style: 'pen' },
]
