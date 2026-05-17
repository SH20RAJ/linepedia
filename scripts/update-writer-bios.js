#!/usr/bin/env node
/**
 * Update writer bios in src/data/writers.json with unique, accurate bios
 * for the top 50 most important poets.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const WRITERS_PATH = join(process.cwd(), 'src/data/writers.json');

const BIO_UPDATES = {
  'william-shakespeare':
    'William Shakespeare (1564–1616) was an English playwright and poet widely regarded as the greatest writer in the English language. He wrote 154 sonnets and narrative poems including "Venus and Adonis" and "The Rape of Lucrece," alongside 37 plays that remain central to world literature.',
  'emily-dickinson':
    'Emily Dickinson (1830–1886) was an American poet who wrote nearly 1,800 poems, most discovered after her death. Her distinctive style—short lines, slant rhyme, dashes instead of punctuation—was revolutionary, and her poems about death, nature, and the self are now considered among the finest in American literature.',
  'edgar-allan-poe':
    'Edgar Allan Poe (1809–1849) was an American poet, critic, and pioneer of the short story. He is best known for poems like "The Raven," "Annabel Lee," and "The Bells," and his dark, musical verse influenced the Symbolist movement and modern horror fiction.',
  'john-keats':
    'John Keats (1795–1821) was an English Romantic poet whose odes—"Ode to a Nightingale," "Ode on a Grecian Urn," "To Autumn"—are among the most celebrated in the language. Despite dying of tuberculosis at 25, he produced work of extraordinary sensory richness and philosophical depth.',
  'walt-whitman':
    'Walt Whitman (1819–1892) was an American poet who pioneered free verse with his collection "Leaves of Grass" (1855). His poem "Song of Myself" celebrates democracy, the body, and the interconnectedness of all life, and he is often called the father of modern American poetry.',
  'robert-frost':
    'Robert Frost (1874–1963) was an American poet who won four Pulitzer Prizes for Poetry. His accessible yet deeply layered poems—including "The Road Not Taken," "Stopping by Woods on a Snowy Evening," and "Mending Wall"—explore rural life, individual choice, and human isolation.',
  'william-wordsworth':
    'William Wordsworth (1770–1850) was an English Romantic poet who launched the movement with Samuel Taylor Coleridge in "Lyrical Ballads" (1798). His poems—including "I Wandered Lonely as a Cloud" and "Tintern Abbey"—championed nature, memory, and the language of common speech.',
  'percy-bysshe-shelley':
    'Percy Bysshe Shelley (1792–1822) was an English Romantic poet known for "Ozymandias," "Ode to the West Wind," and "Prometheus Unbound." A radical idealist, his poetry championed political liberty and the transformative power of imagination.',
  'lord-byron':
    'Lord Byron (1788–1824) was an English Romantic poet famous for "Don Juan," "Childe Harold\'s Pilgrimage," and the creation of the Byronic hero—brooding, defiant, and morally complex. He was one of the most famous poets in Europe during his lifetime.',
  'samuel-taylor-coleridge':
    'Samuel Taylor Coleridge (1772–1834) was an English poet and critic who co-founded English Romanticism with Wordsworth. His poems "The Rime of the Ancient Mariner" and "Kubla Khan" are masterworks of supernatural imagination, and his "Biographia Literaria" shaped literary criticism.',
  'samuel-coleridge':
    'Samuel Taylor Coleridge (1772–1834) was an English poet and critic who co-founded English Romanticism with Wordsworth. His poems "The Rime of the Ancient Mariner" and "Kubla Khan" are masterworks of supernatural imagination, and his "Biographia Literaria" shaped literary criticism.',
  'alfred-lord-tennyson':
    'Alfred, Lord Tennyson (1809–1892) served as British Poet Laureate for 42 years. His poems—including "The Charge of the Light Brigade," "Ulysses," and "In Memoriam A.H.H."—address Victorian concerns with faith, doubt, duty, and loss in memorable musical verse.',
  'lord-alfred-tennyson':
    'Alfred, Lord Tennyson (1809–1892) served as British Poet Laureate for 42 years. His poems—including "The Charge of the Light Brigade," "Ulysses," and "In Memoriam A.H.H."—address Victorian concerns with faith, doubt, duty, and loss in memorable musical verse.',
  'john-donne':
    'John Donne (1572–1631) was an English metaphysical poet and clergyman known for intellectually complex love poems like "The Flea" and "A Valediction: Forbidding Mourning," as well as profound religious meditations including "No Man is an Island" and the "Holy Sonnets."',
  'geoffrey-chaucer':
    'Geoffrey Chaucer (c. 1343–1400) is often called the father of English literature. His masterpiece "The Canterbury Tales"—a collection of stories told by pilgrims traveling to Canterbury—established English as a literary language and remains one of the most important works of medieval literature.',
  'john-milton':
    'John Milton (1608–1674) was an English poet best known for "Paradise Lost" (1667), an epic poem retelling the biblical story of the Fall of Man. He also wrote "Paradise Regained," "Samson Agonistes," and the pastoral elegy "Lycidas," and is considered the greatest English epic poet.',
  'alexander-pope':
    'Alexander Pope (1688–1744) was an English poet and the master of the heroic couplet. His works include "The Rape of the Lock," "An Essay on Man," and brilliant translations of Homer. He was the dominant poet of the Augustan age and a master of satirical verse.',
  'william-blake':
    'William Blake (1757–1827) was an English poet, painter, and printmaker who created his own illuminated books. His collections "Songs of Innocence" and "Songs of Experience" contain poems like "The Tyger" and "London," exploring innocence, oppression, and visionary imagination.',
  'elizabeth-barrett-browning':
    'Elizabeth Barrett Browning (1806–1861) was one of the most prominent English poets of the Victorian era. Her "Sonnets from the Portuguese" are among the most famous love poems in English, and her verse novel "Aurora Leigh" addressed women\'s roles in society and art.',
  'christina-rossetti':
    'Christina Rossetti (1830–1894) was an English poet associated with the Pre-Raphaelite movement. She wrote "Goblin Market," a complex narrative poem, as well as devotional poetry, children\'s verse, and the carol "In the Bleak Midwinter."',
  'emily-bronte':
    'Emily Brontë (1818–1848) was an English novelist and poet best known for "Wuthering Heights." Her poetry—intense, visionary, and often exploring themes of nature, death, and spiritual longing—was praised by critics after her early death at age 30.',
  'anne-bronte':
    'Anne Brontë (1820–1849) was the youngest of the three Brontë sisters and the author of "Agnes Grey" and "The Tenant of Wildfell Hall," one of the first sustained feminist novels in English. Her poetry explores faith, nature, and the condition of women.',
  'charlotte-bronte':
    'Charlotte Brontë (1816–1855) was an English novelist and poet best known for "Jane Eyre" (1847), a groundbreaking novel about a governess asserting her independence. Her poetry, published with her sisters as "Poems by Currer, Ellis and Acton Bell," explores passion and isolation.',
  'gerard-manley-hopkins':
    'Gerard Manley Hopkins (1844–1889) was an English Jesuit poet who invented "sprung rhythm," a new metrical system. His poems—including "The Windhover," "Pied Beauty," and "God\'s Grandeur"—were published posthumously and are now celebrated for their ecstatic language and innovative prosody.',
  'robert-burns':
    'Robert Burns (1759–1796) was Scotland\'s national poet, celebrated worldwide on Burns Night. He wrote in Scots and English, producing poems like "Auld Lang Syne," "A Red, Red Rose," and "To a Mouse," championing democratic values and the dignity of common people.',
  'rudyard-kipling':
    'Rudyard Kipling (1865–1936) was a British poet, novelist, and short-story writer who won the Nobel Prize in Literature in 1907. His poems include "If—," "The White Man\'s Burden," and the "Just So Stories," and he remains one of the most widely read English-language authors.',
  'oscar-wilde':
    'Oscar Wilde (1854–1900) was an Irish poet, playwright, and wit known for "The Picture of Dorian Gray," "The Importance of Being Earnest," and "The Ballad of Reading Gaol." His poetry ranges from light verse to profound meditations on suffering and beauty.',
  'dante-gabriel-rossetti':
    'Dante Gabriel Rossetti (1828–1882) was an English poet and painter who co-founded the Pre-Raphaelite Brotherhood. His poems—including "The Blessed Damozel" and "Sonnets and Songs towards a Workhouse"—blend medieval imagery with sensuous lyricism.',
  'edmund-spenser':
    'Edmund Spenser (c. 1552–1599) was an English poet best known for "The Faerie Queene," an allegorical epic celebrating the Tudor dynasty. He invented the Spenserian stanza and is considered one of the greatest English poets of the Renaissance.',
  'andrew-marvell':
    'Andrew Marvell (1621–1678) was an English metaphysical poet and politician. His poem "To His Coy Mistress" is one of the most famous carpe diem poems in English, and his "The Garden" and "Bermudas" explore nature, time, and divine providence.',
  'ben-jonson':
    'Ben Jonson (1572–1637) was an English poet, playwright, and critic who became the de facto Poet Laureate. His poems include "Drink to Me Only with Thine Eyes" and "To Penshurst," and his masques and comedies made him one of the most important literary figures of the Jacobean era.',
  'christopher-marlowe':
    'Christopher Marlowe (1564–1593) was an English playwright and poet whose "Doctor Faustus" and "Tamburlaine" pioneered English tragic drama. His blank verse innovations influenced Shakespeare, and his lyric "The Passionate Shepherd to His Love" remains widely anthologized.',
  'henry-wadsworth-longfellow':
    'Henry Wadsworth Longfellow (1807–1882) was the most popular American poet of the 19th century. His narrative poems—including "Paul Revere\'s Ride," "Evangeline," and "The Song of Hiawatha"—made poetry accessible to a mass audience and shaped American cultural identity.',
  'edgar-lee-masters':
    'Edgar Lee Masters (1868–1950) was an American poet best known for "Spoon River Anthology" (1915), a collection of epitaphs from a fictional Illinois town that revealed the hidden lives and regrets of its residents. It pioneered American modernist poetry.',
  'edna-st-vincent-millay':
    'Edna St. Vincent Millay (1892–1950) was an American poet who won the Pulitzer Prize for Poetry in 1923. Her sonnet "Renascence" launched her career, and her work—passionate, witty, and formally accomplished—made her a voice for female independence and artistic freedom.',
  'sara-teasdale':
    'Sara Teasdale (1884–1933) was an American lyric poet who won the first Pulitzer Prize for Poetry in 1918. Her poems—including "There Will Come Soft Rains" and "I Am Not Yours"—are known for their clarity, emotional precision, and themes of love, nature, and impermanence.',
  'langston-hughes':
    'Langston Hughes (1901–1967) was an American poet and central figure of the Harlem Renaissance. His poems—including "The Negro Speaks of Rivers," "I, Too," and "Harlem"—gave voice to the Black American experience with jazz rhythms, vernacular speech, and unflinching social commentary.',
  'maya-angelou':
    'Maya Angelou (1928–2014) was an American poet, memoirist, and civil rights activist. Her poem "Still I Rise" and autobiography "I Know Why the Caged Bird Sings" are landmarks of American literature, addressing race, identity, resilience, and womanhood.',
  'allama-muhammad-iqbal':
    'Allama Muhammad Iqbal (1877–1938) was an Urdu and Persian poet-philosopher regarded as the spiritual father of Pakistan. His poems "Shikwa," "Jawab-e-Shikwa," and "Lab Pe Aati Hai Dua" blend Sufi philosophy with political vision, inspiring the Pakistan movement.',
  'allama-iqbal':
    'Allama Muhammad Iqbal (1877–1938) was an Urdu and Persian poet-philosopher regarded as the spiritual father of Pakistan. His poems "Shikwa," "Jawab-e-Shikwa," and "Lab Pe Aati Hai Dua" blend Sufi philosophy with political vision, inspiring the Pakistan movement.',
  'mirza-ghalib':
    'Mirza Ghalib (1797–1869) was the greatest Urdu ghazal poet, whose verses on love, loss, and philosophical inquiry are considered the pinnacle of Urdu literature. Writing during the decline of the Mughal Empire, his poetry combines intellectual depth with emotional intensity.',
  'faiz-ahmed-faiz':
    'Faiz Ahmed Faiz (1911–1984) was a Pakistani Urdu poet and revolutionary whose work blended romantic imagery with Marxist politics. Poems like "Mujh Se Pehli Si Mohabbat" and "Hum Dekhenge" made him one of the most influential poets of the 20th century in South Asia.',
  'rumi':
    'Jalal ad-Din Muhammad Rumi (1207–1273) was a Persian poet and Sufi mystic whose "Masnavi" and "Divan-e-Shams" explore divine love, spiritual transformation, and the unity of being. He is the best-selling poet in the United States and one of the most widely read poets worldwide.',
  'hafez':
    'Hafez (c. 1315–1390) was a Persian poet considered the master of the ghazal form. His "Divan-e-Hafez" explores love, wine, and spirituality with layers of Sufi metaphor, and his tomb in Shiraz remains a major pilgrimage site in Iran.',
  'omar-khayyam':
    'Omar Khayyam (1048–1131) was a Persian polymath—mathematician, astronomer, and poet—whose "Rubaiyat" (quatrains) meditate on mortality, pleasure, and the mysteries of existence. Edward FitzGerald\'s 19th-century translation made him one of the most quoted poets in English.',
  'saadi':
    'Saadi Shirazi (c. 1210–1292) was a Persian poet and moralist whose "Gulistan" (The Rose Garden) and "Bustan" (The Orchard) are masterpieces of prose and verse. His famous lines "Human beings are members of a whole" are inscribed at the entrance of the United Nations.',
  'john-mccrae':
    'John McCrae (1872–1918) was a Canadian poet, physician, and soldier who wrote "In Flanders Fields" after the Second Battle of Ypres in 1915. The poem became the most famous work of World War I and established the poppy as a symbol of remembrance.',
  'rupert-brooke':
    'Rupert Brooke (1887–1915) was an English war poet whose sonnets—including "The Soldier" ("If I should die, think only this of me")—idealized the sacrifice of war. He died of sepsis en route to Gallipoli and became a symbol of the lost generation of WWI.',
  'siegfried-sassoon':
    'Siegfried Sassoon (1886–1967) was an English war poet whose trench poetry—including "The General," "Suicide in the Trenches," and "Everyone Sang"—combined biting satire with lyrical beauty. His public protest against the war made him one of its most courageous voices.',
  'wilfred-owen':
    'Wilfred Owen (1893–1918) was an English war poet whose poems—including "Dulce et Decorum Est," "Anthem for Doomed Youth," and "Strange Meeting"—are the most powerful anti-war poetry in the English language. He was killed in action one week before the Armistice.',
  'edward-thomas':
    'Edward Thomas (1878–1917) was an English poet and nature writer who turned to poetry only in 1914. His poems—including "Adlestrop," "The Owl," and "Rain"—combine precise observation of the English landscape with a deep sense of loss. He was killed at the Battle of Arras.',
  'thomas-hardy':
    'Thomas Hardy (1840–1928) was an English novelist and poet whose novels "Tess of the d\'Urbervilles" and "Far from the Madding Crowd" are classics of Victorian fiction. His poetry—over 900 poems—explores fate, time, and human resilience with stark, unadorned language.',
  'algernon-charles-swinburne':
    'Algernon Charles Swinburne (1837–1909) was an English poet known for metrical innovation and bold themes. His "Atalanta in Calydon" and "Poems and Ballads" challenged Victorian conventions with their musical intensity and controversial subject matter.',
  'john-clare':
    'John Clare (1793–1864) was an English poet known as the "peasant poet" for his humble origins. His nature poetry—including "I Am" and "Badger"—captures the English countryside with extraordinary precision and emotional honesty, and he is now recognized as one of the finest nature poets in the language.',
  'william-topaz-mcgonagall':
    'William Topaz McGonagall (c. 1825–1902) was a Scottish poet famously remembered as one of the worst poets in English literature. Despite his lack of conventional skill, his earnest poems—including "The Tay Bridge Disaster"—have earned him a devoted following and a unique place in literary history.',
  'robert-browning':
    'Robert Browning (1812–1889) was a major English Victorian poet who perfected the dramatic monologue form. His poems—including "My Last Duchess," "The Pied Piper of Hamelin," and "Fra Lippo Lippi"—explore psychology, morality, and art through the voices of vividly drawn characters.',
  'robert-herrick':
    'Robert Herrick (1591–1674) was an English Cavalier poet whose "Hesperides" (1648) contains over 1,200 poems. His carpe diem verse "To the Virgins, to Make Much of Time" ("Gather ye rosebuds while ye may") and lyric poems celebrate love, beauty, and the passing of time.',
  'robert-louis-stevenson':
    'Robert Louis Stevenson (1850–1894) was a Scottish novelist, poet, and travel writer best known for "Treasure Island" and "Strange Case of Dr Jekyll and Mr Hyde." His "A Child\'s Garden of Verses" (1885) remains a beloved classic of children\'s poetry.',
  'michael-drayton':
    'Michael Drayton (1563–1631) was an English poet whose "Poly-Olbion" (1612–1622) is a vast topographical poem describing the landscape and legends of England and Wales. His sonnet "Since there\'s no help" is among the finest of the Elizabethan era.',
  'eugene-field':
    'Eugene Field (1850–1895) was an American writer and poet known as the "children\'s poet." His poems "Wynken, Blynken, and Nod" and "Little Boy Blue" are cherished classics of American children\'s literature.',
  'thomas-moore':
    'Thomas Moore (1779–1852) was an Irish poet, singer, and songwriter best known for "Irish Melodies" (1808–1834), a collection of songs including "The Last Rose of Summer" and "Believe Me, If All Those Endearing Young Charms." He was the most popular poet of his era in the British Isles.',
  'stephen-crane':
    'Stephen Crane (1871–1900) was an American novelist and poet whose "The Red Badge of Courage" revolutionized war fiction. His free-verse poetry—influenced by Symbolism—collected in "The Black Riders" (1895) and "War Is Kind" (1899) anticipated modernist poetry.',
  'amy-levy':
    'Amy Levy (1861–1889) was an English poet and novelist whose work explored themes of Jewish identity, feminism, and urban alienation. Her "A London Plane-Tree" and "Xantippe and Other Verse" anticipate modernist concerns with irony and psychological complexity.',
  'anne-kingsmill-finch':
    'Anne Kingsmill Finch, Countess of Winchilsea (1661–1720), was an English poet whose work was rediscovered in the 20th century. Her poem "The Nocturnal Reverie" and her exploration of female creativity in "The Introduction" make her an important precursor to Romantic poetry.',
  'william-cowper':
    'William Cowper (1731–1800) was an English poet and hymnodist whose work bridges the gap between the Augustan age and Romanticism. His poems "The Task" and "John Gilpin" were enormously popular, and his hymn "God Moves in a Mysterious Way" remains widely sung.',
  'anne-bradstreet':
    'Anne Bradstreet (c. 1612–1672) was the first published poet of English America. Her collection "The Tenth Muse" (1650) explores domestic life, faith, and the New World experience, and she is considered the founding mother of American poetry.',
  'christopher-smart':
    'Christopher Smart (1722–1771) was an English poet whose "Jubilate Agno" (written in confinement) and "A Song to David" are among the most original devotional poems in English. His joyful, cataloguing style influenced later poets including Wordsworth and Browning.',
  'george-herbert':
    'George Herbert (1593–1633) was an English metaphysical poet and Anglican priest whose "The Temple" (1633) is one of the greatest collections of devotional poetry in English. Poems like "The Collar," "Easter Wings," and "Love (III)" explore the soul\'s relationship with God.',
  'sidney-lanier':
    'Sidney Lanier (1842–1881) was an American poet and musician whose poems—including "The Marshes of Glynn" and "Song of the Chattahoochee"—are known for their musical quality and celebration of the Southern landscape.',
  'joyce-kilmer':
    'Joyce Kilmer (1886–1918) was an American poet and journalist best known for his poem "Trees" ("I think that I shall never see / A poem lovely as a tree"). He was killed in action during World War I at the Second Battle of the Marne.',
  'edward-taylor':
    'Edward Taylor (c. 1642–1729) was an American Puritan poet and minister whose "Preparatory Meditations" are among the finest devotional poetry in English. His work was largely unpublished until the 20th century, when it was recognized as a major achievement.',
  'isaac-watts':
    'Isaac Watts (1674–1748) was an English hymnodist, theologian, and poet who wrote over 750 hymns, including "Joy to the World," "When I Survey the Wondrous Cross," and "O God, Our Help in Ages Past." He is called the "Father of English Hymnody."',
  'john-dryden':
    'John Dryden (1631–1700) was an English poet, critic, and playwright who served as the first Poet Laureate. His works—including "Absalom and Achitophel," "Mac Flecknoe," and "Alexander\'s Feast"—established the heroic couplet as the dominant verse form of the Restoration.',
  'walter-savage-landor':
    'Walter Savage Landor (1775–1864) was an English poet and prose writer whose "Imaginary Conversations" and lyric poems are marked by classical restraint and epigrammatic wit. His poem "Rose Aylmer" is one of the most admired short poems in English.',
  'alan-seeger':
    'Alan Seeger (1888–1916) was an American poet who fought in the French Foreign Legion during World War I. His poem "I Have a Rendezvous with Death" is one of the most famous war poems, and he was killed in action at the Battle of the Somme.',
  'phillis-wheatley':
    'Phillis Wheatley (c. 1753–1784) was the first published African-American woman poet. Brought to America as an enslaved person, she published "Poems on Various Subjects, Religious and Moral" (1773), challenging racial assumptions about Black intellectual capacity.',
  'john-greenleaf-whittier':
    'John Greenleaf Whittier (1807–1892) was an American Quaker poet and abolitionist whose poems—including "Snow-Bound" and "Barbara Frietchie"—celebrate New England life and moral courage. He was one of the Fireside Poets and a leading voice against slavery.',
  'robert-southey':
    'Robert Southey (1774–1843) was an English Romantic poet, historian, and biographer who served as Poet Laureate from 1813 to 1843. His poems include "The Battle of Blenheim" and "The Inchcape Rock," and he was a member of the Lake Poets alongside Wordsworth and Coleridge.',
  'william-morris':
    'William Morris (1834–1896) was an English poet, artist, and socialist reformer associated with the Pre-Raphaelites and the Arts and Crafts movement. His epic poems "The Earthly Paradise" and "Sigurd the Volsung" draw on medieval legend and Norse mythology.',
  'lewis-carroll':
    'Lewis Carroll (1832–1898) was the pen name of Charles Dodgson, an English mathematician and author. His poems "Jabberwocky" and "The Walrus and the Carpenter" from the Alice books are among the most famous nonsense poems in English.',
  'paul-laurence-dunbar':
    'Paul Laurence Dunbar (1872–1906) was an American poet and novelist who was one of the first African-American writers to gain national prominence. His poems in dialect—including "When Malindy Sings"—and standard English explore Black life with humor, pathos, and dignity.',
  'matthew-arnold':
    'Matthew Arnold (1822–1888) was an English poet and critic whose poems "Dover Beach" and "The Scholar Gipsy" explore Victorian doubt and the search for meaning. His critical work "Culture and Anarchy" (1869) remains influential in literary and cultural studies.',
  'thomas-hood':
    'Thomas Hood (1799–1845) was an English poet and humorist whose social protest poems "The Song of the Shirt" and "The Bridge of Sighs" drew attention to the plight of the poor. He was also a master of comic verse and wordplay.',
  'sir-philip-sidney':
    'Sir Philip Sidney (1554–1586) was an English poet, soldier, and courtier whose sonnet sequence "Astrophel and Stella" (1591) launched the English sonnet craze. His prose work "The Defence of Poesy" is a foundational text of literary criticism.',
  'charlotte-smith':
    'Charlotte Smith (1749–1806) was an English poet and novelist whose "Elegiac Sonnets" (1784) helped revive the sonnet form and influenced the Romantic poets. Her work explores nature, loss, and social injustice with formal innovation and emotional power.',
  'helen-hunt-jackson':
    'Helen Hunt Jackson (1830–1885) was an American poet and activist whose poetry—including "September"—is known for its lyrical precision. She is better known for her novel "Ramona" and her advocacy for Native American rights.',
  'henry-david-thoreau':
    'Henry David Thoreau (1817–1862) was an American essayist, poet, and philosopher best known for "Walden" and "Civil Disobedience." His poetry, though less celebrated than his prose, reflects his deep connection to nature and his philosophy of simple living.',
  'ralph-waldo-emerson':
    'Ralph Waldo Emerson (1803–1882) was an American essayist, philosopher, and poet who led the Transcendentalist movement. His poems—including "Brahma," "The Rhodora," and "Concord Hymn"—explore nature, self-reliance, and the oversoul.',
  'eliza-cook':
    'Eliza Cook (1818–1889) was an English poet and journalist whose poem "The Old Armchair" made her one of the most popular poets of the Victorian era. Her work championed working-class rights and female independence.',
  'james-whitcomb-riley':
    'James Whitcomb Riley (1849–1916) was an American poet known as the "Hoosier Poet." His dialect poems—including "Little Orphant Annie" and "When the Frost Is on the Punkin"—celebrate rural Indiana life and childhood nostalgia.',
  'james-henry-leigh-hunt':
    'Leigh Hunt (1784–1859) was an English critic, essayist, and poet who championed the Romantics. His poems "Jenny Kissed Me" and "Abou Ben Adhem" are among the most quoted short poems in English, and his literary criticism helped shape the Romantic movement.',
  'ann-taylor':
    'Ann Taylor (1782–1866) was an English poet and children\'s writer who, with her sister Jane, wrote "Original Poems for Infant Minds" (1804). Her poem "My Mother" ("Who fed me from her gentle breast") is one of the most memorized poems in the English language.',
  'jane-taylor':
    'Jane Taylor (1783–1824) was an English poet who wrote "Twinkle, Twinkle, Little Star" (1806) with her sister Ann. The Taylor sisters\' children\'s poetry collections were enormously influential and helped establish the genre of children\'s verse.',
  'gerard-manley-hopkins':
    'Gerard Manley Hopkins (1844–1889) was an English Jesuit poet who invented "sprung rhythm," a new metrical system. His poems—including "The Windhover," "Pied Beauty," and "God\'s Grandeur"—were published posthumously and are now celebrated for their ecstatic language and innovative prosody.',
  'william-ernest-henley':
    'William Ernest Henley (1849–1903) was an English poet, critic, and editor best known for his poem "Invictus" ("I am the master of my fate / I am the captain of my soul"). Written while recovering from tuberculosis of the bone, it has become one of the most quoted poems of courage and resilience.',
  'sir-walter-scott':
    'Sir Walter Scott (1771–1832) was a Scottish novelist, poet, and playwright whose narrative poems—including "The Lady of the Lake," "Marmion," and "The Lay of the Last Minstrel"—popularized Scottish history and legend. He is considered the inventor of the historical novel.',
  'sir-walter-raleigh':
    'Sir Walter Raleigh (c. 1552–1618) was an English poet, courtier, and explorer whose poems—including "The Nymph\'s Reply to the Shepherd"—are masterpieces of Elizabethan lyric poetry. His life of adventure and execution made him one of the most famous figures of the Elizabethan age.',
  'henry-vaughan':
    'Henry Vaughan (1621–1695) was a Welsh metaphysical poet whose "Silex Scintillans" contains some of the finest religious poetry in English. His poem "The World" and "The Retreat" explore eternity, innocence, and spiritual vision with luminous imagery.',
  'john-wilmot':
    'John Wilmot, Earl of Rochester (1647–1680), was an English poet and courtier known for his satirical and libertine verse. His poems—including "A Satire Against Reason and Mankind" and "The Imperfect Enjoyment"—combine intellectual brilliance with provocative honesty.',
  'charles-kingsley':
    'Charles Kingsley (1819–1875) was an English novelist, historian, and poet whose poem "The Three Fishers" and children\'s book "The Water-Babies" are Victorian classics. He was also a social reformer and advocate for "Christian Socialism."',
  'arthur-hugh-clough':
    'Arthur Hugh Clough (1819–1861) was an English poet whose work explores Victorian doubt and moral uncertainty. His poems "Say Not the Struggle Naught Availeth" and "The Latest Decalogue" are sharp, thoughtful, and still widely anthologized.',
  'george-meredith':
    'George Meredith (1828–1909) was an English novelist and poet whose "Modern Love" (1862) is a sequence of 50 sixteen-line sonnets exploring the disintegration of a marriage. It is considered one of the most innovative works of Victorian poetry.',
  'katherine-philips':
    'Katherine Philips (1632–1664) was an English poet known as "The Matchless Orinda." Her poems of female friendship and devotion—including "Friendship\'s Mystery, to My Dearest Lucasia"—were celebrated in her time and helped establish women\'s place in English literary culture.',
  'eliza-cook':
    'Eliza Cook (1818–1889) was an English poet and journalist whose poem "The Old Armchair" made her one of the most popular poets of the Victorian era. Her work championed working-class rights and female independence.',
};

const writers = JSON.parse(readFileSync(WRITERS_PATH, 'utf-8'));

let updated = 0;
for (const writer of writers) {
  if (BIO_UPDATES[writer.slug]) {
    writer.bio = BIO_UPDATES[writer.slug];
    updated++;
  }
}

writeFileSync(WRITERS_PATH, JSON.stringify(writers, null, 2) + '\n', 'utf-8');
console.log(`Updated ${updated} writer bios out of ${writers.length} total writers.`);
