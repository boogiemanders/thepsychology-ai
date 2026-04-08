export interface CalligraphyFont {
  label: string
  family: string
  file: string
  format: 'truetype' | 'opentype' | 'woff'
  style: 'brush' | 'pen'
  storage?: 'r2' | 'local'
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
  { label: 'Sun GuoTing ShuPu', family: 'SunGuoTingShuPu', file: '\u5b59\u8fc7\u5ead\u4e66\u8c31\u4f53.woff', format: 'woff', style: 'brush', storage: 'local', note: 'Limited charset \u2014 classical text only' },
  { label: 'ZhiMang Xing', family: 'ZhiMangXing', file: 'ZhiMangXing-Regular.woff', format: 'woff', style: 'brush', storage: 'local' },
  { label: 'SuXin ShiShuBiao', family: 'SuXinShiShuBiao', file: 'SuXinShiShuBiaoXingShuJian-1.woff', format: 'woff', style: 'brush', storage: 'local' },
  { label: 'XiaoDouDao MoMoZhi', family: 'XiaoDouDaoMoMoZhi', file: 'XiaoDouDaoMoMoZhiCaoShuJian-2.woff', format: 'woff', style: 'brush', storage: 'local' },
  { label: 'Li XuKe ShuFa', family: 'LiXuKeShuFa', file: '\u674e\u65ed\u79d1\u4e66\u6cd51.4.woff', format: 'woff', style: 'brush', storage: 'local' },
  { label: 'HanCheng WangShiLi XingShu', family: 'HanChengWangShiLiXingShu', file: 'HanChengWangShiLiXingShu-2.woff', format: 'woff', style: 'brush', storage: 'local' },
  { label: 'ZiXiaoHun FengYi ShouShu', family: 'ZiXiaoHunFengYiShouShu', file: 'ZiXiaoHunFengYiShouShu.woff', format: 'woff', style: 'brush', storage: 'local' },
  { label: 'CaoTanZhai Mao ZeDong', family: 'CaoTanZhaiMaoZeDong', file: 'CaoTanZhaiMaoZeDong.woff', format: 'woff', style: 'brush', storage: 'local' },
  { label: 'DuanNing MaoBi XingShu', family: 'DuanNingMaoBiXingShu', file: 'DuanNingMaoBiXingShu.woff', format: 'woff', style: 'brush', storage: 'local' },
  { label: 'MiNi Fan ZhiCao', family: 'MiNiFanZhiCao', file: 'MiNiFanZhiCao.woff', format: 'woff', style: 'brush', storage: 'local' },
  { label: 'ZhongQi LiQuan CaoShu', family: 'ZhongQiLiQuanCaoShu', file: 'ZhongQiLiQuanCaoShu.woff', format: 'woff', style: 'brush', storage: 'local' },
  { label: 'ShuTiFang Deng XiaoPing', family: 'ShuTiFangDengXiaoPing', file: 'ShuTiFangDengXiaoPing.woff', format: 'woff', style: 'brush', storage: 'local' },
  { label: 'FangZheng XingTi CaoShu', family: 'FangZhengXingTiCaoShu', file: 'FangZhengXingTiCaoShu.woff', format: 'woff', style: 'brush', storage: 'local' },
  { label: 'FangZheng XingTi CaoShu Jian', family: 'FangZhengXingTiCaoShuJian', file: 'FangZhengXingTiCaoShuJian.woff', format: 'woff', style: 'brush', storage: 'local' },
  // Pen
  { label: 'ZhangYu XiaoRouWan', family: 'ZhangYuXiaoRouWan', file: 'ZhangYuXiaoRouWan-2.woff', format: 'woff', style: 'pen', storage: 'local' },
  { label: 'YingZhang XingShu', family: 'YingZhangXingShu', file: '\u82f1\u7ae0\u884c\u4e66.woff', format: 'woff', style: 'pen', storage: 'local' },
  { label: 'TianWei LiangNiWeiXiao', family: 'TianWeiLiangNiWeiXiao', file: 'TianWeiLiangNiWeiXiao-2.woff', format: 'woff', style: 'pen', storage: 'local' },
  { label: 'XiaoDouDao QiuRiHeJianFan', family: 'XiaoDouDaoQiuRiHeJianFan', file: 'XiaoDouDaoQiuRiHeJianFan-Shan(REEJI-Xiaodou-AutumnGBT-Flash)-2.woff', format: 'woff', style: 'pen', storage: 'local' },
  { label: 'Li GuoFu', family: 'LiGuoFu', file: '\u674e\u56fd\u592b\u624b\u5199\u5b57\u4f53.woff', format: 'woff', style: 'pen', storage: 'local' },
  { label: 'HanCheng BoBo YingCao', family: 'HanChengBoBoYingCao', file: '\u6c49\u5448\u6ce2\u6ce2\u786c\u8349.woff', format: 'woff', style: 'pen', storage: 'local' },
  { label: 'YuWei ShuFa XingShu', family: 'YuWeiShuFaXingShuJianTi', file: 'YuWeiShuFaXingShuJianTi-1.woff', format: 'woff', style: 'pen', storage: 'local' },
  { label: 'ChenJiShi XingKai', family: 'ChenJiShiXingKai', file: 'ChenJiShiXingKai.woff', format: 'woff', style: 'pen', storage: 'local' },
  { label: 'ShangShou HongZhi', family: 'ShangShouHongZhi', file: 'No.104-ShangShouHongZhiShouXieTi-2.woff', format: 'woff', style: 'pen', storage: 'local' },
]
