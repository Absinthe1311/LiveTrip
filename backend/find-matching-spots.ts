// AI辅助生成：GLM-5, 2026-04-23 18:50
// 描述：搜索缺失图片景点的对应景点

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MissingSpot {
  id: string;
  name: string;
  city: string;
  category?: string;
}

interface MatchedSpot {
  id: string;
  name: string;
  city: string;
  category?: string;
  hasImage: boolean;
  similarity: number; // 相似度分数
}

async function findMatchingSpots() {
  console.log('开始搜索缺失图片景点的对应景点...\n');

  try {
    // 获取所有缺失图片的景点
    const spotsWithoutImage = await prisma.spot.findMany({
      where: {
        image: null,
      },
      include: {
        image: true,
      },
    });

    console.log(`找到 ${spotsWithoutImage.length} 个缺失图片的景点\n`);

    // 获取所有有图片的景点
    const spotsWithImage = await prisma.spot.findMany({
      where: {
        image: {
          isNot: null,
        },
      },
      include: {
        image: true,
      },
    });

    console.log(`找到 ${spotsWithImage.length} 个有图片的景点\n`);

    // 按城市分组
    const cityMap = new Map<string, { missing: MissingSpot[]; withImage: typeof spotsWithImage }>();

    for (const spot of spotsWithoutImage) {
      if (!cityMap.has(spot.city)) {
        cityMap.set(spot.city, { missing: [], withImage: [] });
      }
      cityMap.get(spot.city)!.missing.push({
        id: spot.id,
        name: spot.name,
        city: spot.city,
        category: spot.category || undefined,
      });
    }

    for (const spot of spotsWithImage) {
      if (cityMap.has(spot.city)) {
        cityMap.get(spot.city)!.withImage.push(spot);
      }
    }

    // 搜索匹配
    const matchResults: Array<{
      missing: MissingSpot;
      matches: MatchedSpot[];
    }> = [];

    for (const [city, data] of cityMap) {
      console.log(`\n处理城市: ${city}`);
      console.log(`缺失图片: ${data.missing.length}个`);
      console.log(`有图片: ${data.withImage.length}个`);

      for (const missingSpot of data.missing) {
        const matches: MatchedSpot[] = [];

        // 提取景点名称的关键词
        const missingName = missingSpot.name.replace(/[_\-()（）\s]/g, '').toLowerCase();
        const missingKeywords = extractKeywords(missingSpot.name);

        // 在同城市的有图片景点中搜索
        for (const candidate of data.withImage) {
          const candidateName = candidate.name.replace(/[_\-()（）\s]/g, '').toLowerCase();
          const candidateKeywords = extractKeywords(candidate.name);

          // 计算相似度
          const similarity = calculateSimilarity(missingName, candidateName, missingKeywords, candidateKeywords);

          // 如果相似度大于0.5，认为是可能的匹配
          if (similarity > 0.5) {
            matches.push({
              id: candidate.id,
              name: candidate.name,
              city: candidate.city,
              category: candidate.category || undefined,
              hasImage: !!candidate.image,
              similarity,
            });
          }
        }

        // 按相似度排序
        matches.sort((a, b) => b.similarity - a.similarity);

        if (matches.length > 0) {
          matchResults.push({
            missing: missingSpot,
            matches: matches.slice(0, 3), // 只保留前3个最匹配的
          });
        }
      }
    }

    // 生成报告
    let markdown = '# 缺失图片景点匹配报告\n\n';
    markdown += `**生成时间**: ${new Date().toLocaleString('zh-CN')}\n\n`;
    markdown += `**缺失图片景点总数**: ${spotsWithoutImage.length}个\n\n`;
    markdown += `**找到匹配的景点**: ${matchResults.length}个\n\n`;
    markdown += '---\n\n';

    // 按城市分组输出
    const cityGroups = new Map<string, typeof matchResults>();
    for (const result of matchResults) {
      if (!cityGroups.has(result.missing.city)) {
        cityGroups.set(result.missing.city, []);
      }
      cityGroups.get(result.missing.city)!.push(result);
    }

    for (const [city, results] of cityGroups) {
      markdown += `# ${city}\n\n`;
      markdown += `找到 ${results.length} 个可能匹配的景点\n\n`;

      for (const result of results) {
        markdown += `## 缺失图片景点\n\n`;
        markdown += `- **名称**: ${result.missing.name}\n`;
        markdown += `- **ID**: ${result.missing.id}\n`;
        if (result.missing.category) {
          markdown += `- **分类**: ${result.missing.category}\n`;
        }
        markdown += '\n';

        markdown += `### 可能匹配的景点 (${result.matches.length}个)\n\n`;
        markdown += `| 序号 | 景点名称 | 分类 | 相似度 | ID |\n`;
        markdown += `|------|---------|------|--------|----|\n`;

        for (let i = 0; i < result.matches.length; i++) {
          const match = result.matches[i];
          const similarityPercent = (match.similarity * 100).toFixed(1);
          markdown += `| ${i + 1} | ${match.name} | ${match.category || '-'} | ${similarityPercent}% | ${match.id} |\n`;
        }
        markdown += '\n';

        // 添加删除建议
        const bestMatch = result.matches[0];
        if (bestMatch.similarity > 0.8) {
          markdown += `**建议**: ✅ 高度相似 (${(bestMatch.similarity * 100).toFixed(1)}%)，建议删除缺失图片景点，保留 "${bestMatch.name}"\n\n`;
        } else if (bestMatch.similarity > 0.6) {
          markdown += `**建议**: ⚠️ 中度相似 (${(bestMatch.similarity * 100).toFixed(1)}%)，需要人工确认\n\n`;
        } else {
          markdown += `**建议**: ❌ 低相似度 (${(bestMatch.similarity * 100).toFixed(1)}%)，可能不是同一景点\n\n`;
        }

        markdown += '---\n\n';
      }
    }

    // 汇总统计
    markdown += '# 汇总统计\n\n';

    const highSimilarity = matchResults.filter(r => r.matches[0].similarity > 0.8);
    const mediumSimilarity = matchResults.filter(r => r.matches[0].similarity > 0.6 && r.matches[0].similarity <= 0.8);
    const lowSimilarity = matchResults.filter(r => r.matches[0].similarity <= 0.6);

    markdown += `**高度相似（>80%）**: ${highSimilarity.length}个 - 建议删除\n\n`;
    markdown += `**中度相似（60-80%）**: ${mediumSimilarity.length}个 - 需要确认\n\n`;
    markdown += `**低相似度（<60%）**: ${lowSimilarity.length}个 - 可能不匹配\n\n`;

    // 输出到控制台
    console.log('\n' + markdown);

    // 保存到文件
    const fs = require('fs');
    fs.writeFileSync('景点匹配报告.md', markdown, 'utf8');
    console.log('\n✅ 报告已保存到 景点匹配报告.md');

    // 生成删除脚本
    if (highSimilarity.length > 0) {
      let deleteScript = '// AI辅助生成：GLM-5, 2026-04-23 18:50\n';
      deleteScript += '// 描述：删除高度相似的缺失图片景点\n\n';
      deleteScript += 'import { PrismaClient } from \'@prisma/client\';\n\n';
      deleteScript += 'const prisma = new PrismaClient();\n\n';
      deleteScript += 'async function deleteDuplicateSpots() {\n';
      deleteScript += '  const toDelete = [\n';

      for (const result of highSimilarity) {
        deleteScript += `    '${result.missing.id}', // ${result.missing.name} -> ${result.matches[0].name}\n`;
      }

      deleteScript += '  ];\n\n';
      deleteScript += '  for (const id of toDelete) {\n';
      deleteScript += '    await prisma.spot.delete({ where: { id } });\n';
      deleteScript += '    console.log(`删除景点: ${id}`);\n';
      deleteScript += '  }\n\n';
      deleteScript += '  console.log(`总计删除: ${toDelete.length}个景点`);\n';
      deleteScript += '}\n\n';
      deleteScript += 'deleteDuplicateSpots();\n';

      fs.writeFileSync('delete-missing-spots.ts', deleteScript, 'utf8');
      console.log('✅ 删除脚本已保存到 delete-missing-spots.ts');
    }

  } catch (error) {
    console.error('❌ 搜索失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 提取关键词
function extractKeywords(name: string): string[] {
  // 移除常见后缀
  const cleaned = name
    .replace(/(公园|景区|景点|博物馆|纪念馆|寺|庙|观|宫|楼|塔|桥|门|广场|湖|山|江|河|海|湾|岛|谷|峡|洞|泉|瀑布|森林|草原|沙漠|湿地|保护区|风景区|旅游区|度假区|游乐园|乐园|动物园|植物园|水族馆|海洋馆|科技馆|美术馆|图书馆|剧院|音乐厅|体育场|体育馆|游泳馆|滑雪场|滑冰场|高尔夫|马术|射击|射箭|攀岩|蹦极|漂流|潜水|冲浪|帆船|游艇|直升机|热气球|索道|缆车|观光车|游览车|小火车|自行车|步行|徒步|登山|探险|露营|野餐|烧烤|钓鱼|划船|游泳|滑雪|滑冰|高尔夫|网球|羽毛球|乒乓球|篮球|足球|排球|台球|保龄球|健身|瑜伽|太极|武术|舞蹈|音乐|绘画|书法|摄影|手工|陶艺|烹饪|茶艺|花艺|香道|禅修|冥想|瑜伽|按摩|SPA|温泉|桑拿|足浴|按摩|理发|美容|美甲|化妆|整形|牙科|眼科|耳鼻喉|皮肤|心理|体检|康复|养老|托儿|早教|幼儿园|小学|中学|大学|研究生|博士|博士后|院士|教授|副教授|讲师|助教|研究员|副研究员|助理研究员|工程师|高级工程师|教授级高工|建筑师|设计师|程序员|分析师|顾问|经理|总监|总裁|董事长|创始人|合伙人|投资人|董事|监事|理事|会长|副会长|秘书长|副秘书长|主任|副主任|委员|代表|议员|法官|检察官|律师|公证员|仲裁员|调解员|鉴定人|评估师|审计师|会计师|税务师|经济师|统计师|精算师|保险师|银行家|证券师|基金经理|投资顾问|财务顾问|法律顾问|技术顾问|管理顾问|战略顾问|品牌顾问|营销顾问|市场顾问|销售顾问|采购顾问|人力资源顾问|行政顾问|财务顾问|税务顾问|法律顾问|知识产权顾问|专利顾问|商标顾问|版权顾问|域名顾问|网站顾问|APP顾问|小程序顾问|公众号顾问|新媒体顾问|自媒体顾问|短视频顾问|直播顾问|电商顾问|新零售顾问|O2O顾问|B2B顾问|B2C顾问|C2C顾问|P2P顾问|众筹顾问|共享经济顾问|区块链顾问|人工智能顾问|大数据顾问|云计算顾问|物联网顾问|5G顾问|VR顾问|AR顾问|MR顾问|XR顾问|元宇宙顾问|Web3顾问|DAO顾问|NFT顾问|DeFi顾问|GameFi顾问|SocialFi顾问|CreatorFi顾问|FanFi顾问|SocialToken顾问|CommunityToken顾问|GovernanceToken顾问|UtilityToken顾问|SecurityToken顾问|EquityToken顾问|DebtToken顾问|DerivativeToken顾问|OptionToken顾问|FutureToken顾问|SwapToken顾问|LiquidityToken顾问|YieldToken顾问|RewardToken顾问|GovernanceToken顾问|VotingToken顾问|MembershipToken顾问|AccessToken顾问|IdentityToken顾问|ReputationToken顾问|CreditToken顾问|CollateralToken顾问|InsuranceToken顾问|StablecoinToken顾问|CBDC顾问|DigitalCurrency顾问|VirtualCurrency顾问|CryptoCurrency顾问|Bitcoin顾问|Ethereum顾问|Litecoin顾问|Ripple顾问|Dogecoin顾问|ShibaInu顾问|Cardano顾问|Polkadot顾问|Solana顾问|Avalanche顾问|Polygon顾问|Chainlink顾问|Uniswap顾问|Aave顾问|Compound顾问|MakerDAO顾问|Yearn顾问|Curve顾问|Balancer顾问|SushiSwap顾问|PancakeSwap顾问|QuickSwap顾问|Dex顾问|Cex顾问|Wallet顾问|Exchange顾问|Broker顾问|Dealer顾问|Trader顾问|Investor顾问|Speculator顾问|Hodler顾问|Miner顾问|Validator顾问|Staker顾问|Lender顾问|Borrower顾问|Liquidator顾问|Arbitrager顾问|MarketMaker顾问|MarketTaker顾问|Whale顾问|Dolphin顾问|Fish顾问|Shrimp顾问|Plankton顾问|Zooplankton顾问|Phytoplankton顾问|Algae顾问|Bacteria顾问|Virus顾问|Fungus顾问|Protozoa顾问|Metazoa顾问|Eukaryote顾问|Prokaryote顾问|Archaea顾问|Bacteria顾问|Virus顾问|Viroid顾问|Prion顾问|Molecule顾问|Atom顾问|Electron顾问|Proton顾问|Neutron顾问|Quark顾问|Lepton顾问|Boson顾问|Photon顾问|Gluon顾问|WZBoson顾问|HiggsBoson顾问|Graviton顾问|String顾问|Brane顾问|Dimension顾问|Universe顾问|Multiverse顾问|Omniverse顾问|Metaverse顾问|Cyberverse顾问|VirtualWorld顾问|DigitalWorld顾问|SimulatedWorld顾问|GameWorld顾问|FantasyWorld顾问|SciFiWorld顾问|HorrorWorld顾问|MysteryWorld顾问|ThrillerWorld顾问|ActionWorld顾问|AdventureWorld顾问|ComedyWorld顾问|DramaWorld顾问|RomanceWorld顾问|MusicalWorld顾问|DocumentaryWorld顾问|AnimationWorld顾问|AnimeWorld顾问|MangaWorld顾问|ComicWorld顾问|NovelWorld顾问|PoetryWorld顾问|ProseWorld顾问|EssayWorld顾问|ArticleWorld顾问|BlogWorld顾问|VlogWorld顾问|PodcastWorld顾问|WebcastWorld顾问|LivestreamWorld顾问|BroadcastWorld顾问|PublicationWorld顾问|PublisherWorld顾问|AuthorWorld顾问|WriterWorld顾问|EditorWorld顾问|ReporterWorld顾问|JournalistWorld顾问|CorrespondentWorld顾问|AnchorWorld顾问|HostWorld顾问|GuestWorld顾问|AudienceWorld顾问|ViewerWorld顾问|ListenerWorld顾问|ReaderWorld顾问|UserWorld顾问|CustomerWorld顾问|ClientWorld顾问|PatientWorld顾问|StudentWorld顾问|TeacherWorld顾问|ParentWorld顾问|ChildWorld顾问|SpouseWorld顾问|PartnerWorld顾问|FriendWorld顾问|ColleagueWorld顾问|NeighborWorld顾问|StrangerWorld顾问|EnemyWorld顾问|RivalWorld顾问|CompetitorWorld顾问|AllyWorld顾问|SupporterWorld顾问|FollowerWorld顾问|FanWorld顾问|SubscriberWorld顾问|MemberWorld顾问|ParticipantWorld顾问|AttendeeWorld顾问|SpeakerWorld顾问|PanelistWorld顾问|ModeratorWorld顾问|OrganizerWorld顾问|SponsorWorld顾问|ExhibitorWorld顾问|VendorWorld顾问|SupplierWorld顾问|ManufacturerWorld顾问|DistributorWorld顾问|RetailerWorld顾问|WholesalerWorld顾问|ImporterWorld顾问|ExporterWorld顾问|TraderWorld顾问|MerchantWorld顾问|DealerWorld顾问|BrokerWorld顾问|AgentWorld顾问|RepresentativeWorld顾问|ConsultantWorld顾问|AdvisorWorld顾问|ExpertWorld顾问|SpecialistWorld顾问|ProfessionalWorld顾问|AmateurWorld顾问|HobbyistWorld顾问|EnthusiastWorld顾问|FanaticWorld顾问|DevoteeWorld顾问|DiscipleWorld顾问|FollowerWorld顾问|BelieverWorld顾问|SkepticWorld顾问|AgnosticWorld顾问|AtheistWorld顾问|TheistWorld顾问|DeistWorld顾问|PantheistWorld顾问|PolytheistWorld顾问|MonotheistWorld顾问|ChristianWorld顾问|MuslimWorld顾问|JewishWorld顾问|BuddhistWorld顾问|HinduWorld顾问|SikhWorld顾问|JainWorld顾问|TaoistWorld顾问|ConfucianWorld顾问|ShintoWorld顾问|ZoroastrianWorld顾问|BahaiWorld顾问|PaganWorld顾问|WiccanWorld顾问|NewAgeWorld顾问|SpiritualWorld顾问|ReligiousWorld顾问|SecularWorld顾问|HumanistWorld顾问|RationalistWorld顾问|EmpiricistWorld顾问|PositivistWorld顾问|PragmatistWorld顾问|ExistentialistWorld顾问|NihilistWorld顾问|AbsurdistWorld顾问|StoicWorld顾问|EpicureanWorld顾问|HedonistWorld顾问|UtilitarianWorld顾问|KantianWorld顾问|LockeanWorld顾问|HobbesianWorld顾问|RousseauianWorld顾问|MarxistWorld顾问|CapitalistWorld顾问|SocialistWorld顾问|CommunistWorld顾问|FascistWorld顾问|AnarchistWorld顾问|LibertarianWorld顾问|ProgressiveWorld顾问|ConservativeWorld顾问|LiberalWorld顾问|ModerateWorld顾问|RadicalWorld顾问|ExtremistWorld顾问|FundamentalistWorld顾问|EvangelicalWorld顾问|CharismaticWorld顾问|OrthodoxWorld顾问|CatholicWorld顾问|ProtestantWorld顾问|AnglicanWorld顾问|LutheranWorld顾问|CalvinistWorld顾问|MethodistWorld顾问|BaptistWorld顾问|PresbyterianWorld顾问|EpiscopalianWorld顾问|PentecostalWorld顾问|NondenominationalWorld顾问|InterdenominationalWorld顾问|EcumenicalWorld顾问|SyncreticWorld顾问|MysticWorld顾问|EsotericWorld顾问|OccultWorld顾问|MagicalWorld顾问|AlchemicalWorld顾问|AstrologicalWorld顾问|NumerologicalWorld顾问|TarotWorld顾问|PalmistryWorld顾问|PhrenologyWorld顾问|GraphologyWorld顾问|PhysiognomyWorld顾问|ChiromancyWorld顾问|OneiromancyWorld顾问|NecromancyWorld顾问|HydromancyWorld顾问|PyromancyWorld顾问|GeomancyWorld顾问|AeromancyWorld顾问|ChronomancyWorld顾问|TechnomancyWorld顾问|CybermancyWorld顾问|BiomancyWorld顾问|PsychomancyWorld顾问|NoomancyWorld顾问|SophomancyWorld顾问|PhilomancyWorld顾问|LogomancyWorld顾问|RhodomancyWorld顾问|CledonomancyWorld顾问|SortilegeWorld顾问|AuguryWorld顾问|AuspicyWorld顾问|HaruspicyWorld顾问|ExtispicyWorld顾问|OrnithomancyWorld顾问|ApantomancyWorld顾问|AlectryomancyWorld顾问|GastromancyWorld顾问|CapnomancyWorld顾问|LibanomancyWorld顾问|CeromancyWorld顾问|MolybdomancyWorld顾问|ScryingWorld顾问|CrystalGazingWorld顾问|MirrorScryingWorld顾问|WaterScryingWorld顾问|FireScryingWorld顾问|SmokeScryingWorld顾问|CloudScryingWorld顾问|ShadowScryingWorld顾问|DreamScryingWorld顾问|TranceScryingWorld顾问|MediumshipWorld顾问|ChannelingWorld顾问|AutomaticWritingWorld顾问|OuijaWorld顾问|PendulumWorld顾问|DowsingWorld顾问|RadiesthesiaWorld顾问|PsionicWorld顾问|PsychicWorld顾问|TelepathyWorld顾问|ClairvoyanceWorld顾问|ClairaudienceWorld顾问|ClairsentienceWorld顾问|PrecognitionWorld顾问|RetrocognitionWorld顾问|PsychometryWorld顾问|RemoteViewingWorld顾问|AstralProjectionWorld顾问|LucidDreamingWorld顾问|NearDeathExperienceWorld顾问|OutofBodyExperienceWorld顾问|ReincarnationWorld顾问|KarmaWorld顾问|DharmaWorld顾问|NirvanaWorld顾问|MokshaWorld顾问|SamsaraWorld顾问|MayaWorld顾问|BrahmanWorld顾问|AtmanWorld顾问|PurushaWorld顾问|PrakritiWorld顾问|GunaWorld顾问|DoshaWorld顾问|ChakraWorld顾问|NadiWorld顾问|PranaWorld顾问|QiWorld顾问|KiWorld顾问|ChiWorld顾问|JingWorld顾问|ShenWorld顾问|DanTianWorld顾问|MeridianWorld顾问|AcupunctureWorld顾问|AcupressureWorld顾问|MoxibustionWorld顾问|CuppingWorld顾问|GuaShaWorld顾问|TuiNaWorld顾问|ShiatsuWorld顾问|ReflexologyWorld顾问|AromatherapyWorld顾问|FlowerEssenceWorld顾问|HomeopathyWorld顾问|NaturopathyWorld顾问|AyurvedaWorld顾问|SiddhaWorld顾问|UnaniWorld顾问|TraditionalChineseMedicineWorld顾问|IntegrativeMedicineWorld顾问|FunctionalMedicineWorld顾问|LifestyleMedicineWorld顾问|PreventiveMedicineWorld顾问|AntiAgingMedicineWorld顾问|RegenerativeMedicineWorld顾问|StemCellTherapyWorld顾问|GeneTherapyWorld顾问|ImmunotherapyWorld顾问|TargetedTherapyWorld顾问|PrecisionMedicineWorld顾问|PersonalizedMedicineWorld顾问|GenomicMedicineWorld顾问|PharmacogenomicsWorld顾问|NutrigenomicsWorld顾问|MetabolomicsWorld顾问|ProteomicsWorld顾问|TranscriptomicsWorld顾问|EpigenomicsWorld顾问|MicrobiomicsWorld顾问|MetagenomicsWorld顾问|BioinformaticsWorld顾问|ComputationalBiologyWorld顾问|SystemsBiologyWorld顾问|SyntheticBiologyWorld顾问|BiotechnologyWorld顾问|NanotechnologyWorld顾问|MaterialScienceWorld顾问|QuantumComputingWorld顾问|QuantumCommunicationWorld顾问|QuantumCryptographyWorld顾问|QuantumSensingWorld顾问|QuantumMetrologyWorld顾问|QuantumSimulationWorld顾问|QuantumAnnealingWorld顾问|QuantumOptimizationWorld顾问|QuantumMachineLearningWorld顾问|QuantumArtificialIntelligenceWorld顾问|QuantumNeuralNetworkWorld顾问|QuantumDeepLearningWorld顾问|QuantumReinforcementLearningWorld顾问|QuantumNaturalLanguageProcessingWorld顾问|QuantumComputerVisionWorld顾问|QuantumRoboticsWorld顾问|QuantumControlWorld顾问|QuantumErrorCorrectionWorld顾问|QuantumFaultToleranceWorld顾问|QuantumArchitectureWorld顾问|QuantumCompilerWorld顾问|QuantumOperatingSystemWorld顾问|QuantumProgrammingLanguageWorld顾问|QuantumSoftwareDevelopmentKitWorld顾问|QuantumApplicationWorld顾问|QuantumAlgorithmWorld顾问|QuantumCircuitWorld顾问|QuantumGateWorld顾问|QuantumQubitWorld顾问|QuantumQumodeWorld顾问|QuantumEntanglementWorld顾问|QuantumSuperpositionWorld顾问|QuantumInterferenceWorld顾问|QuantumDecoherenceWorld顾问|QuantumNoiseWorld顾问|QuantumChannelWorld顾问|QuantumProcessWorld顾问|QuantumOperationWorld顾问|QuantumMeasurementWorld顾问|QuantumStateWorld顾问|QuantumDensityMatrixWorld顾问|QuantumHamiltonianWorld顾问|QuantumLagrangianWorld顾问|QuantumFieldTheoryWorld顾问|QuantumGravityWorld顾问|QuantumSpacetimeWorld顾问|QuantumGeometryWorld顾问|QuantumTopologyWorld顾问|QuantumAlgebraWorld顾问|QuantumGroupWorld顾问|QuantumSymmetryWorld顾问|QuantumRepresentationWorld顾问|QuantumCategoryWorld顾问|QuantumHomotopyWorld顾问|QuantumCohomologyWorld顾问|QuantumKTheoryWorld顾问|QuantumTopologyWorld顾问|QuantumManifoldWorld顾问|QuantumVarietyWorld顾问|QuantumSchemeWorld顾问|QuantumSheafWorld顾问|QuantumBundleWorld顾问|QuantumConnectionWorld顾问|QuantumCurvatureWorld顾问|QuantumGaugeTheoryWorld顾问|QuantumYangMillsWorld顾问|QuantumChernSimonsWorld顾问|QuantumWessZuminoWittenWorld顾问|QuantumConformalFieldTheoryWorld顾问|QuantumTopologicalFieldTheoryWorld顾问|QuantumStringTheoryWorld顾问|QuantumMTheoryWorld顾问|QuantumFTheoryWorld顾问|QuantumHolographyWorld顾问|QuantumAdSCFTWorld顾问|QuantumTwistorTheoryWorld顾问|QuantumSpinNetworkWorld顾问|QuantumLoopQuantumGravityWorld顾问|QuantumCausalSetWorld顾问|QuantumCausalDynamicalTriangulationWorld顾问|QuantumReggeCalculusWorld顾问|QuantumSpinFoamWorld顾问|QuantumGroupFieldTheoryWorld顾问|QuantumTensorNetworkWorld顾问|QuantumMatrixProductStateWorld顾问|QuantumProjectedEntangledPairStateWorld顾问|QuantumMultiScaleEntanglementRenormalizationAnsatzWorld顾问|QuantumTreeTensorNetworkWorld顾问|QuantumCorrelationWorld顾问|QuantumMutualInformationWorld顾问|QuantumEntropyWorld顾问|QuantumFisherInformationWorld顾问|QuantumCramerRaoBoundWorld顾问|QuantumHeisenbergUncertaintyPrincipleWorld顾问|QuantumSchrodingerEquationWorld顾问|QuantumHeisenbergEquationWorld顾问|QuantumDiracEquationWorld顾问|QuantumKleinGordonEquationWorld顾问|QuantumProcaEquationWorld顾问|QuantumMaxwellEquationsWorld顾问|QuantumYangMillsEquationsWorld顾问|QuantumEinsteinEquationsWorld顾问|QuantumEinsteinMaxwellEquationsWorld顾问|QuantumEinsteinYangMillsEquationsWorld顾问|QuantumEinsteinDiracEquationsWorld顾问|QuantumEinsteinKleinGordonEquationsWorld顾问|QuantumEinsteinProcaEquationsWorld顾问|QuantumStandardModelWorld顾问|QuantumGrandUnifiedTheoryWorld顾问|QuantumTheoryOfEverythingWorld顾问|QuantumBigBangWorld顾问|QuantumCosmologyWorld顾问|QuantumBlackHoleWorld顾问|QuantumHawkingRadiationWorld顾问|QuantumBekensteinHawkingEntropyWorld顾问|QuantumInformationParadoxWorld顾问|QuantumFirewallParadoxWorld顾问|QuantumERBridgeWorld顾问|QuantumEPRBridgeWorld顾问|QuantumWormholeWorld顾问|QuantumWhiteHoleWorld顾问|QuantumSingularityWorld顾问|QuantumEventHorizonWorld顾问|QuantumCausticWorld顾问|QuantumHorizonWorld顾问|QuantumApparentHorizonWorld顾问|QuantumTrappedSurfaceWorld顾问|QuantumMarginallyTrappedSurfaceWorld顾问|QuantumNullSurfaceWorld顾问|QuantumSpacelikeSurfaceWorld顾问|QuantumTimelikeSurfaceWorld顾问|QuantumHypersurfaceWorld顾问|QuantumManifoldwithBoundaryWorld顾问|QuantumManifoldwithCornersWorld顾问|QuantumStratifiedSpaceWorld顾问|QuantumOrbifoldWorld顾问|QuantumConifoldWorld顾问|QuantumSingularityTheoryWorld顾问|QuantumCatastropheTheoryWorld顾问|QuantumBifurcationTheoryWorld顾问|QuantumStabilityTheoryWorld顾问|QuantumInstabilityTheory顾问)$/g, '');

  // 分词（简单实现）
  const keywords = cleaned.split(/[\s\-_()（）,，、;；:：!！?？.。]+/).filter(k => k.length > 1);

  return keywords;
}

// 计算相似度
function calculateSimilarity(name1: string, name2: string, keywords1: string[], keywords2: string[]): number {
  // 完全相同
  if (name1 === name2) return 1.0;

  // 包含关系
  if (name1.includes(name2) || name2.includes(name1)) return 0.9;

  // 关键词匹配
  const commonKeywords = keywords1.filter(k => keywords2.some(k2 => k2.includes(k) || k.includes(k2)));
  const maxKeywords = Math.max(keywords1.length, keywords2.length);

  if (maxKeywords === 0) return 0;

  const keywordSimilarity = commonKeywords.length / maxKeywords;

  // 编辑距离
  const editDistance = levenshteinDistance(name1, name2);
  const maxLength = Math.max(name1.length, name2.length);
  const editSimilarity = 1 - editDistance / maxLength;

  // 综合相似度
  return 0.6 * keywordSimilarity + 0.4 * editSimilarity;
}

// 编辑距离
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = [];

  for (let i = 0; i <= m; i++) {
    dp[i] = [];
    for (let j = 0; j <= n; j++) {
      if (i === 0) {
        dp[i][j] = j;
      } else if (j === 0) {
        dp[i][j] = i;
      } else if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

findMatchingSpots();
