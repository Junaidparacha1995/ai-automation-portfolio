const diagramNode=(stage,x,y,kind,label,branch=null,z=0)=>({stage,x,y,kind,label,branch,z});
const node=diagramNode;

const workflowDiagrams = {
  'crm-automation': {
    title:'Lead routing',
    stages:['Inquiry','Routing','CRM and Drive','Slack draft'],
    nodes:[
      node(0,-230,0,'inbox','Inquiry'),node(1,-111,0,'agent','Router'),
      node(1,5,-74,'route','Sales','Sales',9),
      node(1,5,-25,'route','Support','Support',6),
      node(1,5,25,'route','Partnerships','Partnerships',3),
      node(1,5,74,'route','Manual review','Manual review'),
      node(2,126,-46,'table','CRM',null,10),node(2,126,46,'document','Drive'),
      node(3,235,0,'message','Slack draft',null,13)
    ],
    links:[[0,1,1],[1,2,1,'Sales'],[1,3,1,'Support'],[1,4,1,'Partnerships'],[1,5,1,'Manual review'],
      ...['Sales','Support','Partnerships','Manual review'].flatMap((team,i)=>[[i+2,6,2,team],[i+2,7,2,team]]),
      [6,8,3],[7,8,3]]
  },
  'document-qa': {
    title:'Document retrieval',
    stages:['Question','Search terms','Passages','Citation'],
    nodes:[
      node(0,-231,3,'message','Question'),node(1,-115,-60,'search','Search terms',null,12),node(1,-115,50,'document','Policy'),
      node(2,25,-81,'document','§ 1',null,0),node(2,25,-27,'document','§ 2',null,5),
      node(2,25,27,'document','§ 3',null,10),node(2,25,81,'document','§ 4'),
      node(3,222,0,'quote','Cited answer',null,13)
    ],
    links:[[0,1,1],[2,3,2],[2,4,2],[2,5,2],[2,6,2],[1,3,2],[1,4,2],[1,5,2],[1,6,2],[3,7,3,'§1'],[4,7,3,'§2'],[5,7,3,'§3'],[6,7,3,'§4']]
  },
  'airtable-agent': {
    title:'Table query',
    stages:['Request','Schema','Records','Answer'],
    nodes:[
      node(0,-220,-52,'message','Request'),node(1,-113,-52,'table','Schema',null,10),
      node(2,5,-52,'search','Filter / group',null,12),node(2,5,58,'table','Lead records',null,3),
      node(3,186,3,'list','Answer',null,17)
    ],
    links:[[0,1,1],[1,2,2],[3,2,2],[2,4,3]]
  },
  'movie-agent': {
    title:'Catalog search and ranking',
    stages:['Preferences','Query','Matches','Ranking'],
    nodes:[
      node(0,-230,0,'sliders','Preferences'),node(1,-109,0,'search','Catalog query',null,12),
      node(2,12,-66,'film','Match',null,11),node(2,12,0,'film','Match',null,16),node(2,12,66,'film','Match',null,5),
      node(3,215,-14,'list','Ranked list',null,24)
    ],
    links:[[0,1,1],[1,2,2],[1,3,2],[1,4,2],[2,5,3],[3,5,3],[4,5,3]]
  },
  'reinforcement-learning': {
    title:'Learning from feedback',
    stages:['State','Learning rule','Training','Outcome'],
    nodes:[
      node(0,-165,-53,'grid','State',null,6),node(1,164,-53,'sliders','Next action',null,18),
      node(2,164,62,'signal','Reward',null,9),node(3,-165,62,'agent','Policy update',null,14)
    ],
    links:[[0,1,1],[1,2,2],[2,3,3],[3,0,3]]
  },
  cartpole: {
    nodes:[node(0,-213,34,'grid','Pole state'),node(1,-75,-47,'sliders','Controller',null,12),
      node(2,55,42,'signal','Physics',null,8),node(3,209,-23,'list','Trial result',null,16)],
    links:[[0,1,1],[1,2,2],[2,3,3]]
  },
  'wall-segmentation': {
    title:'Pixel mask',
    stages:['Room','Regions','Mask','Overlay'],
    nodes:[
      node(0,-219,17,'room','Room grid'),node(1,-91,-41,'grid','Wall regions',null,10),
      node(2,41,-41,'mask','Binary mask',null,22),node(3,191,17,'room','Wall overlay',null,8)
    ],
    links:[[0,1,1],[1,2,2],[2,3,3]]
  },
  'crop-disease': {
    title:'Crop image classification',
    nodes:[
      node(0,-223,14,'leaf','Leaf photo'),
      node(1,-105,-50,'grid','RGB channels',null,12),node(1,-105,52,'sliders','Normalize',null,4),
      node(2,29,-14,'agent','Classifier',null,21),
      node(3,185,-43,'list','Ranked labels',null,12),node(3,185,49,'signal','Model scores')
    ],
    links:[[0,1,1],[1,2,1],[1,3,2],[2,3,2],[3,4,3],[3,5,3]]
  },
  'crop-preprocess': {
    title:'Image preparation',
    stages:['Sample','RGB','Normalize','Model input'],
    nodes:[
      node(0,-214,0,'leaf','Leaf sample'),node(1,-93,-54,'grid','RGB pixels',null,12),
      node(2,41,44,'sliders','Normalize',null,8),node(3,215,-10,'grid','Input tensor',null,17)
    ],
    links:[[0,1,1],[1,2,2],[2,3,3]]
  },
  'lab-safety': {
    title:'PPE detection',
    nodes:[
      node(0,-200,-44,'image','Photo'),node(1,-80,47,'grid','Input image',null,5),
      node(2,37,-44,'agent','Detector',null,19),node(2,76,62,'box','Candidates',null,12),
      node(3,212,-6,'box','Annotated photo',null,14)
    ],
    links:[[0,1,1],[1,2,2],[2,3,2],[3,4,3]]
  }
};
