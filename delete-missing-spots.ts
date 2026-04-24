// AI辅助生成：GLM-5, 2026-04-23 18:50
// 描述：删除高度相似的缺失图片景点

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteDuplicateSpots() {
  const toDelete = [
    'cmn5k03k2000snub0xgidqs6l', // 世纪广场(南京路步行街) -> 南京路步行街
    'cmn5k03ky000znub0t6v06ems', // 北外滩滨江绿地小巨蛋 -> 北外滩滨江绿地
    'cmn5k03l60011nub0fxbw4tt9', // 东方明珠旅游码头 -> 东方明珠
    'cmn5k03lf0013nub01zi3ulw2', // 豫园-九曲桥 -> 豫园
    'cmn5k03m10018nub0dkt0hc0f', // 外滩观光隧道 -> 外滩
    'cmn5k03m60019nub08925orq2', // 上海世博会博物馆 -> 上海博物馆
    'cmnrixg9k0000nunwbj00fj2m', // 上海博物馆_人民广场馆 -> 上海博物馆(人民广场馆)
    'cmnrixgfp0001nunwhjix303r', // 世纪广场_南京路步行街 -> 南京路步行街
    'cmnrixglf0002nunwaminklpp', // 中国共产党第一次全国代表大会会址纪念馆 -> 中国共产党第一次全国代表大会会址
    'cmnrje1vt0001nuds8gmxqfi3', // 白云观_上海 -> 白云观
    'cmnrje1x80002nudspoihjyt1', // 人民公园_上海 -> 人民公园
    'cmnrixh4x0004nunwogxlt71l', // 中山公园_北京 -> 中山公园
    'cmnrixih70009nunwdyguvvnc', // 毛主席纪念堂 -> 毛主席纪念堂(暂停开放)
    'cmnrixiqr000bnunwa8hrfpsu', // 白云观_北京 -> 白云观
    'cmnrje30c0006nudsdqey6prb', // 巧克巧蔻_巧克力博物馆_北京馆 -> 巧克巧蔻·巧克力博物馆(北京馆)
    'cmnrje42u000bnuds0senrnz7', // 鼓楼_北京 -> 鼓楼
    'cmna1w6x10156nuwwcjiaal17', // 铁像寺水街 -> 铁像寺
    'cmna1w6y6015enuww2frgbv91', // 桂溪生态公园西区 -> 桂溪生态公园
    'cmna1w6ym015hnuww2vpho0jq', // 桂溪生态公园东区 -> 桂溪生态公园
    'cmna1w72k0166nuwwjvsno3y9', // 成都博物馆 -> 成都武侯祠博物馆
    'cmnrje4nd000enudsnfia484u', // 东湖公园_成都 -> 东湖公园
    'cmnh7iiek05wtnuo4946502d6', // 仙岳公园 -> 仙岳公园-天竺岩寺
    'cmnh7iifo05x2nuo44h5xsktz', // 厦门市鼓浪屿风景名胜区-皓月园 -> 鼓浪屿
    'cmnh7iiho05xhnuo43bd0gtnl', // 鼓浪屿钢琴博物馆 -> 鼓浪屿
    'cmnh7iihw05xjnuo4jgxsjqj6', // 厦门白鹭洲公园西公园 -> 厦门白鹭洲公园
    'cmnh7iiij05xonuo456g25ul2', // 鼓浪屿风琴博物馆 -> 鼓浪屿
    'cmnh7iiis05xqnuo4rr1kq6wb', // 厦门市动物园 -> 厦门市博物馆
    'cmnrixjkr000enunwbcumcqx1', // 狐尾山公园-观景台 -> 狐尾山公园
    'cmnrje4n3000dnuds1k8dezxx', // 中山公园_厦门 -> 中山公园
    'cmnrixl4d000knunw76zjumft', // 城市阳台江堤步道 -> 城市阳台
    'cmnrixloi000lnunw9tztknyv', // 杭州西湖风景名胜区-太子湾公园 -> 西湖
    'cmnrixmuv000qnunws2uiyebb', // 杭州钱塘江夜游_滨江码头 -> 杭州钱塘江夜游(滨江码头)
    'cmnrixpwj0012nunw86zumb4w', // 红旗铁路公园 -> 红旗铁路公园观光小火车团结里北站
    'cmnrje9dp000wnudsl53f0gjj', // 汉城湖旅游风景区-汉武大帝雕像 -> 汉城湖旅游风景区
    'cmnrjeact000xnuds7e0k6z16', // 驼铃传奇_秀 -> 《驼铃传奇》秀
  ];

  for (const id of toDelete) {
    await prisma.spot.delete({ where: { id } });
    console.log(`删除景点: ${id}`);
  }

  console.log(`总计删除: ${toDelete.length}个景点`);
}

deleteDuplicateSpots();
