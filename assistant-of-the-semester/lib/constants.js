export const CATEGORIES = [
  { key: 'terfavorit', label: 'Asisten Terfavorit', icon: 'heart', tagline: 'Selalu punya tempat spesial di hati mahasiswa.', tint: 'pink', number: '01' },
  { key: 'terkagum', label: 'Asisten Terkagum', icon: 'sparkles', tagline: 'Sosok yang paling menginspirasi dan bikin kagum.', tint: 'purple', number: '02' },
  { key: 'terasik', label: 'Asisten Terasik', icon: 'smile', tagline: 'Paling seru, asik, dan bikin suasana hidup.', tint: 'orange', number: '03' },
  { key: 'terdingin', label: 'Asisten Terdingin', icon: 'snowflake', tagline: 'Paling kalem, cool, dan punya aura misterius.', tint: 'blue', number: '04' }
];
export const CATEGORY_KEYS = CATEGORIES.map((category) => category.key);
export const DEMO_DATA = {
  demo:true,votingOpen:false,
  programs:['Teknik Telekomunikasi','Teknik Telekomunikasi INT','Teknik Komputer','Teknik Elektro','Teknik Elektro INT','Teknik Biomedis'],
  groups:[
    {id:'1',program_name:'Teknik Telekomunikasi',group_number:1},
    {id:'2',program_name:'Teknik Telekomunikasi INT',group_number:1},
    {id:'3',program_name:'Teknik Komputer',group_number:1},
    {id:'4',program_name:'Teknik Elektro',group_number:1},
    {id:'5',program_name:'Teknik Elektro INT',group_number:1},
    {id:'6',program_name:'Teknik Biomedis',group_number:1}
  ],
  voters:[
    {id:'1',class_id:'1',name:'Contoh Mahasiswa TT'},
    {id:'2',class_id:'2',name:'Contoh Mahasiswa TT INT'},
    {id:'3',class_id:'3',name:'Contoh Mahasiswa TK'},
    {id:'4',class_id:'4',name:'Contoh Mahasiswa TE'},
    {id:'5',class_id:'5',name:'Contoh Mahasiswa TE INT'},
    {id:'6',class_id:'6',name:'Contoh Mahasiswa Biomedis'}
  ],
  assistants:[
    {id:'1',name:'Asisten A',photo_url:'',description:'Foto dapat diunggah admin.'},
    {id:'2',name:'Asisten B',photo_url:'',description:'Foto dapat diunggah admin.'},
    {id:'3',name:'Asisten C',photo_url:'',description:'Foto dapat diunggah admin.'},
    {id:'4',name:'Asisten D',photo_url:'',description:'Foto dapat diunggah admin.'}
  ]
};
