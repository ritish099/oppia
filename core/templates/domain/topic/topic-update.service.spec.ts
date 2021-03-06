// Copyright 2018 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Tests for Topic update service.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// topic-update.service.ts is upgraded to Angular 8.
import { RecordedVoiceoversObjectFactory } from
  'domain/exploration/RecordedVoiceoversObjectFactory';
import { ShortSkillSummaryObjectFactory } from
  'domain/skill/ShortSkillSummaryObjectFactory';
import { StoryReferenceObjectFactory } from
  'domain/topic/StoryReferenceObjectFactory';
import { SubtitledHtmlObjectFactory } from
  'domain/exploration/SubtitledHtmlObjectFactory';
import { SubtopicObjectFactory } from 'domain/topic/SubtopicObjectFactory';
import { SubtopicPageContentsObjectFactory } from
  'domain/topic/SubtopicPageContentsObjectFactory';
import { SubtopicPageObjectFactory } from
  'domain/topic/SubtopicPageObjectFactory';
import { VoiceoverObjectFactory } from
  'domain/exploration/VoiceoverObjectFactory';
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('App.ts');
require('domain/editor/undo_redo/undo-redo.service.ts');
require('domain/topic/TopicObjectFactory.ts');
require('domain/topic/topic-update.service.ts');

describe('Topic update service', function() {
  var recordedVoiceoversObjectFactory = null;
  var TopicUpdateService = null;
  var TopicObjectFactory = null;
  var skillSummaryObjectFactory = null;
  var subtitledHtmlObjectFactory = null;
  var subtopicPageObjectFactory = null;
  var UndoRedoService = null;
  var _sampleTopic = null;
  var _firstSkillSummary = null;
  var _secondSkillSummary = null;
  var _thirdSkillSummary = null;
  var _sampleSubtopicPage = null;

  var sampleTopicBackendObject = {
    topicDict: {
      id: 'sample_topic_id',
      name: 'Topic name',
      description: 'Topic description',
      version: 1,
      uncategorized_skill_ids: ['skill_1'],
      canonical_story_references: [{
        story_id: 'story_1',
        story_is_published: true
      }, {
        story_id: 'story_2',
        story_is_published: true
      }, {
        story_id: 'story_3',
        story_is_published: true
      }],
      additional_story_references: [{
        story_id: 'story_2',
        story_is_published: true
      }],
      subtopics: [{
        id: 1,
        title: 'Title',
        skill_ids: ['skill_2']
      }],
      next_subtopic_id: 2,
      language_code: 'en'
    },
    skillIdToDescriptionDict: {
      skill_1: 'Description 1',
      skill_2: 'Description 2'
    }
  };
  var sampleSubtopicPageObject = {
    id: 'topic_id-1',
    topic_id: 'topic_id',
    page_contents: {
      subtitled_html: {
        html: 'test content',
        content_id: 'content'
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {
            en: {
              filename: 'test.mp3',
              file_size_bytes: 100,
              needs_update: false,
              duration_secs: 0.1
            }
          }
        }
      }
    },
    language_code: 'en'
  };
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value(
      'RecordedVoiceoversObjectFactory',
      new RecordedVoiceoversObjectFactory(new VoiceoverObjectFactory()));
    $provide.value(
      'ShortSkillSummaryObjectFactory', new ShortSkillSummaryObjectFactory());
    $provide.value(
      'StoryReferenceObjectFactory', new StoryReferenceObjectFactory());
    $provide.value(
      'SubtitledHtmlObjectFactory', new SubtitledHtmlObjectFactory());
    $provide.value(
      'SubtopicObjectFactory',
      new SubtopicObjectFactory(new ShortSkillSummaryObjectFactory()));
    $provide.value(
      'SubtopicPageContentsObjectFactory',
      new SubtopicPageContentsObjectFactory(
        new RecordedVoiceoversObjectFactory(new VoiceoverObjectFactory()),
        new SubtitledHtmlObjectFactory()));
    $provide.value(
      'SubtopicPageObjectFactory', new SubtopicPageObjectFactory(
        new SubtopicPageContentsObjectFactory(
          new RecordedVoiceoversObjectFactory(new VoiceoverObjectFactory()),
          new SubtitledHtmlObjectFactory())));
    $provide.value('VoiceoverObjectFactory', new VoiceoverObjectFactory());
  }));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector) {
    recordedVoiceoversObjectFactory = $injector.get(
      'RecordedVoiceoversObjectFactory');
    TopicUpdateService = $injector.get('TopicUpdateService');
    TopicObjectFactory = $injector.get('TopicObjectFactory');
    subtitledHtmlObjectFactory = $injector.get('SubtitledHtmlObjectFactory');
    subtopicPageObjectFactory = $injector.get('SubtopicPageObjectFactory');
    UndoRedoService = $injector.get('UndoRedoService');
    skillSummaryObjectFactory = $injector.get('ShortSkillSummaryObjectFactory');

    _firstSkillSummary = skillSummaryObjectFactory.create(
      'skill_1', 'Description 1');
    _secondSkillSummary = skillSummaryObjectFactory.create(
      'skill_2', 'Description 2');
    _thirdSkillSummary = skillSummaryObjectFactory.create(
      'skill_3', 'Description 3');

    _sampleSubtopicPage = subtopicPageObjectFactory.createFromBackendDict(
      sampleSubtopicPageObject);
    _sampleTopic = TopicObjectFactory.create(
      sampleTopicBackendObject.topicDict,
      sampleTopicBackendObject.skillIdToDescriptionDict);
  }));

  it('should remove/add an additional story id from/to a topic', function() {
    expect(_sampleTopic.getAdditionalStoryIds()).toEqual(['story_2']);
    TopicUpdateService.removeAdditionalStory(_sampleTopic, 'story_2');
    expect(_sampleTopic.getAdditionalStoryIds()).toEqual([]);

    UndoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getAdditionalStoryIds()).toEqual(['story_2']);
  }
  );

  it('should create a proper backend change dict for removing an additional ' +
    'story id', function() {
    TopicUpdateService.removeAdditionalStory(_sampleTopic, 'story_2');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'delete_additional_story',
      story_id: 'story_2'
    }]);
  });

  it('should not create a backend change dict for removing an additional ' +
    'story id when an error is encountered', function() {
    expect(function() {
      TopicUpdateService.removeAdditionalStory(_sampleTopic, 'story_5');
    }).toThrowError('Given story id not present in additional story ids.');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([]);
  });

  it('should remove/add a canonical story id from/to a topic', function() {
    let canonicalStoryIds = _sampleTopic.getCanonicalStoryIds();
    expect(canonicalStoryIds).toEqual(
      ['story_1', 'story_2', 'story_3']);
    TopicUpdateService.removeCanonicalStory(_sampleTopic, 'story_1');
    canonicalStoryIds = _sampleTopic.getCanonicalStoryIds();
    expect(canonicalStoryIds).toEqual(['story_2', 'story_3']);

    UndoRedoService.undoChange(_sampleTopic);
    canonicalStoryIds = _sampleTopic.getCanonicalStoryIds();
    expect(canonicalStoryIds).toEqual(
      ['story_2', 'story_3', 'story_1']);
  });

  it('should create a proper backend change dict for removing a canonical ' +
    'story id', function() {
    TopicUpdateService.removeCanonicalStory(_sampleTopic, 'story_1');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'delete_canonical_story',
      story_id: 'story_1'
    }]);
  });

  it('should not create a backend change dict for removing a canonical ' +
    'story id when an error is encountered', function() {
    expect(function() {
      TopicUpdateService.removeCanonicalStory(_sampleTopic, 'story_10');
    }).toThrowError('Given story id not present in canonical story ids.');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([]);
  });

  it('should remove/add an uncategorized skill id from/to a topic', function() {
    expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([
      _firstSkillSummary
    ]);
    TopicUpdateService.removeUncategorizedSkill(
      _sampleTopic, _firstSkillSummary
    );
    expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([]);

    UndoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([
      _firstSkillSummary
    ]);
  }
  );

  it('should create a proper backend change dict for removing an ' +
    'uncategorized skill id', function() {
    TopicUpdateService.removeUncategorizedSkill(
      _sampleTopic, _firstSkillSummary);
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'remove_uncategorized_skill_id',
      uncategorized_skill_id: 'skill_1'
    }]);
  });

  it('should not create a backend change dict for removing an uncategorized ' +
    'skill id when an error is encountered', function() {
    expect(function() {
      TopicUpdateService.removeUncategorizedSkill(
        _sampleTopic, _thirdSkillSummary);
    }).toThrowError('Given skillId is not an uncategorized skill.');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([]);
  });

  it('should set/unset changes to a topic\'s name', function() {
    expect(_sampleTopic.getName()).toEqual('Topic name');

    TopicUpdateService.setTopicName(_sampleTopic, 'new unique value');
    expect(_sampleTopic.getName()).toEqual('new unique value');

    UndoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getName()).toEqual('Topic name');
  });

  it('should create a proper backend change dict ' +
    'for changing a topic\'s name', function() {
    TopicUpdateService.setTopicName(_sampleTopic, 'new unique value');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_topic_property',
      property_name: 'name',
      new_value: 'new unique value',
      old_value: 'Topic name'
    }]);
  });

  it('should set/unset changes to a topic\'s description', function() {
    expect(_sampleTopic.getDescription()).toEqual('Topic description');

    TopicUpdateService.setTopicDescription(_sampleTopic, 'new unique value');
    expect(_sampleTopic.getDescription()).toEqual('new unique value');

    UndoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getDescription()).toEqual('Topic description');
  });

  it('should create a proper backend change dict ' +
    'for changing a topic\'s description', function() {
    TopicUpdateService.setTopicDescription(_sampleTopic, 'new unique value');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_topic_property',
      property_name: 'description',
      new_value: 'new unique value',
      old_value: 'Topic description'
    }]);
  });

  it('should set/unset changes to a topic\'s abbreviated name', function() {
    expect(_sampleTopic.getAbbreviatedName()).toEqual(undefined);

    TopicUpdateService.setAbbreviatedTopicName(
      _sampleTopic, 'new unique value');
    expect(_sampleTopic.getAbbreviatedName()).toEqual('new unique value');

    UndoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getAbbreviatedName()).toEqual(undefined);
  });

  it('should create a proper backend change dict ' +
    'for changing a topic\'s abbreviated name', function() {
    TopicUpdateService.setAbbreviatedTopicName(
      _sampleTopic, 'new unique value');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_topic_property',
      property_name: 'abbreviated_name',
      new_value: 'new unique value',
      old_value: null
    }]);
  });

  it('should set/unset changes to a topic\'s meta tag content', function() {
    expect(_sampleTopic.getMetaTagContent()).toEqual(undefined);

    TopicUpdateService.setMetaTagContent(
      _sampleTopic, 'new meta tag content');
    expect(_sampleTopic.getMetaTagContent()).toEqual('new meta tag content');

    UndoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getMetaTagContent()).toEqual(undefined);
  });

  it('should create a proper backend change dict ' +
    'for changing a topic\'s meta tag content', function() {
    TopicUpdateService.setMetaTagContent(
      _sampleTopic, 'new meta tag content');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_topic_property',
      property_name: 'meta_tag_content',
      new_value: 'new meta tag content',
      old_value: null
    }]);
  });

  it('should set/unset changes to a topic\'s practice tab is ' +
    'displayed property', function() {
    expect(_sampleTopic.getPracticeTabIsDisplayed()).toBeUndefined();

    TopicUpdateService.setPracticeTabIsDisplayed(_sampleTopic, true);
    expect(_sampleTopic.getPracticeTabIsDisplayed()).toEqual(true);

    UndoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getPracticeTabIsDisplayed()).toBeUndefined();
  });

  it('should create a proper backend change dict ' +
    'for changing a topic\'s practice tab is displayed property', function() {
    TopicUpdateService.setPracticeTabIsDisplayed(_sampleTopic, true);
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_topic_property',
      property_name: 'practice_tab_is_displayed',
      new_value: true,
      old_value: null
    }]);
  });

  it('should set/unset changes to a topic\'s url fragment', function() {
    expect(_sampleTopic.getUrlFragment()).toEqual(undefined);

    TopicUpdateService.setTopicUrlFragment(_sampleTopic, 'new-unique-value');
    expect(_sampleTopic.getUrlFragment()).toEqual('new-unique-value');

    UndoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getUrlFragment()).toEqual(undefined);
  });

  it('should create a proper backend change dict ' +
    'for changing a topic\'s url fragment', function() {
    TopicUpdateService.setTopicUrlFragment(_sampleTopic, 'new-unique-value');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_topic_property',
      property_name: 'url_fragment',
      new_value: 'new-unique-value',
      old_value: null
    }]);
  });

  it('should set/unset changes to a topic\'s thumbnail filename', function() {
    expect(_sampleTopic.getThumbnailFilename()).toEqual(undefined);

    TopicUpdateService.setTopicThumbnailFilename(
      _sampleTopic, 'new unique value');
    expect(_sampleTopic.getThumbnailFilename()).toEqual('new unique value');

    UndoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getThumbnailFilename()).toEqual(undefined);
  });

  it('should create a proper backend change dict ' +
    'for changing a topic\'s thumbnail filename', function() {
    TopicUpdateService.setTopicThumbnailFilename(
      _sampleTopic, 'new unique value');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_topic_property',
      property_name: 'thumbnail_filename',
      new_value: 'new unique value',
      old_value: null
    }]);
  });

  it('should set/unset changes to a topic\'s thumbnail bg color', function() {
    expect(_sampleTopic.getThumbnailBgColor()).toEqual(undefined);

    TopicUpdateService.setTopicThumbnailBgColor(
      _sampleTopic, '#ffffff');
    expect(_sampleTopic.getThumbnailBgColor()).toEqual('#ffffff');

    UndoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getThumbnailBgColor()).toEqual(undefined);
  });

  it('should create a proper backend change dict ' +
    'for changing a topic\'s thumbnail bg color', function() {
    TopicUpdateService.setTopicThumbnailBgColor(
      _sampleTopic, 'new unique value');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_topic_property',
      property_name: 'thumbnail_bg_color',
      new_value: 'new unique value',
      old_value: null
    }]);
  });

  it('should set/unset changes to a topic\'s language code', function() {
    expect(_sampleTopic.getLanguageCode()).toEqual('en');

    TopicUpdateService.setTopicLanguageCode(_sampleTopic, 'fr');
    expect(_sampleTopic.getLanguageCode()).toEqual('fr');

    UndoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getLanguageCode()).toEqual('en');
  });

  it('should create a proper backend change dict ' +
    'for changing a topic\'s language code', function() {
    TopicUpdateService.setTopicLanguageCode(_sampleTopic, 'fr');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_topic_property',
      property_name: 'language_code',
      new_value: 'fr',
      old_value: 'en'
    }]);
  });

  it('should not create a backend change dict for changing subtopic title ' +
    'when the subtopic does not exist', function() {
    expect(function() {
      TopicUpdateService.setSubtopicTitle(_sampleTopic, 10, 'whatever');
    }).toThrowError('Subtopic doesn\'t exist');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([]);
  });

  it('should set/unset changes to a subtopic\'s title', function() {
    expect(_sampleTopic.getSubtopics()[0].getTitle())
      .toEqual('Title');
    TopicUpdateService.setSubtopicTitle(_sampleTopic, 1, 'new unique value');
    expect(_sampleTopic.getSubtopics()[0].getTitle())
      .toEqual('new unique value');

    UndoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getSubtopics()[0].getTitle())
      .toEqual('Title');
  });

  it('should create a proper backend change dict for changing subtopic ' +
    'title', function() {
    TopicUpdateService.setSubtopicTitle(_sampleTopic, 1, 'new unique value');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_subtopic_property',
      subtopic_id: 1,
      property_name: 'title',
      new_value: 'new unique value',
      old_value: 'Title'
    }]);
  }
  );

  it('should not create a backend change dict for changing subtopic ' +
    'thumbnail filename when the subtopic does not exist', function() {
    expect(function() {
      TopicUpdateService
        .setSubtopicThumbnailFilename(_sampleTopic, 10, 'whatever');
    }).toThrowError('Subtopic doesn\'t exist');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([]);
  });

  it('should set/unset changes to a subtopic\'s thumbnail' +
    'filename', function() {
    expect(_sampleTopic.getSubtopics()[0].getThumbnailFilename())
      .toEqual(undefined);

    TopicUpdateService
      .setSubtopicThumbnailFilename(_sampleTopic, 1, 'filename');
    expect(_sampleTopic.getSubtopics()[0].getThumbnailFilename())
      .toEqual('filename');

    UndoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getSubtopics()[0].getThumbnailFilename())
      .toEqual(undefined);
  });

  it('should create a proper backend change dict for changing subtopic ' +
    'thumbnail filename', function() {
    TopicUpdateService
      .setSubtopicThumbnailFilename(_sampleTopic, 1, 'filename');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_subtopic_property',
      subtopic_id: 1,
      property_name: 'thumbnail_filename',
      new_value: 'filename',
      old_value: undefined
    }]);
  }
  );

  it('should not create a backend change dict for changing subtopic ' +
    'thumbnail bg color when the subtopic does not exist', function() {
    expect(function() {
      TopicUpdateService
        .setSubtopicThumbnailBgColor(_sampleTopic, 10, 'whatever');
    }).toThrowError('Subtopic doesn\'t exist');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([]);
  });

  it('should create a proper backend change dict for changing subtopic ' +
    'url fragment', function() {
    TopicUpdateService.setSubtopicUrlFragment(_sampleTopic, 1, 'subtopic-url');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_subtopic_property',
      subtopic_id: 1,
      property_name: 'url_fragment',
      new_value: 'subtopic-url',
      old_value: undefined
    }]);
  });

  it('should not create a backend change dict for changing subtopic ' +
    'url fragment when the subtopic does not exist', function() {
    expect(function() {
      TopicUpdateService.setSubtopicUrlFragment(_sampleTopic, 10, 'whatever');
    }).toThrowError('Subtopic doesn\'t exist');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([]);
  });

  it('should set/unset changes to a subtopic\'s url fragment', function() {
    expect(_sampleTopic.getSubtopics()[0].getUrlFragment()).toEqual(undefined);

    TopicUpdateService.setSubtopicUrlFragment(_sampleTopic, 1, 'test-url');
    expect(_sampleTopic.getSubtopics()[0].getUrlFragment()).toEqual(
      'test-url');

    UndoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getSubtopics()[0].getUrlFragment())
      .toEqual(undefined);
  });

  it('should set/unset changes to a subtopic\'s thumbnail bg ' +
    'color', function() {
    expect(_sampleTopic.getSubtopics()[0].getThumbnailBgColor())
      .toEqual(undefined);

    TopicUpdateService
      .setSubtopicThumbnailBgColor(_sampleTopic, 1, '#ffffff');
    expect(_sampleTopic.getSubtopics()[0].getThumbnailBgColor())
      .toEqual('#ffffff');

    UndoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getSubtopics()[0].getThumbnailBgColor())
      .toEqual(undefined);
  });

  it('should create a proper backend change dict for changing subtopic ' +
    'thumbnail bg color', function() {
    TopicUpdateService
      .setSubtopicThumbnailBgColor(_sampleTopic, 1, '#ffffff');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_subtopic_property',
      subtopic_id: 1,
      property_name: 'thumbnail_bg_color',
      new_value: '#ffffff',
      old_value: undefined
    }]);
  });

  it('should add/remove a subtopic', function() {
    expect(_sampleTopic.getSubtopics().length).toEqual(1);
    TopicUpdateService.addSubtopic(_sampleTopic, 'Title2');
    expect(_sampleTopic.getSubtopics().length).toEqual(2);
    expect(_sampleTopic.getNextSubtopicId()).toEqual(3);
    expect(_sampleTopic.getSubtopics()[1].getTitle()).toEqual('Title2');
    expect(_sampleTopic.getSubtopics()[1].getId()).toEqual(2);

    UndoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getSubtopics().length).toEqual(1);
  });

  it('should rearrange a canonical story', function() {
    let canonicalStoryIds = _sampleTopic.getCanonicalStoryIds();
    expect(canonicalStoryIds.length).toEqual(3);
    expect(canonicalStoryIds[0]).toEqual('story_1');
    expect(canonicalStoryIds[1]).toEqual('story_2');
    expect(canonicalStoryIds[2]).toEqual('story_3');

    TopicUpdateService.rearrangeCanonicalStory(_sampleTopic, 1, 0);
    canonicalStoryIds = _sampleTopic.getCanonicalStoryIds();
    expect(canonicalStoryIds[0]).toEqual('story_2');
    expect(canonicalStoryIds[1]).toEqual('story_1');
    expect(canonicalStoryIds[2]).toEqual('story_3');

    TopicUpdateService.rearrangeCanonicalStory(_sampleTopic, 2, 1);
    canonicalStoryIds = _sampleTopic.getCanonicalStoryIds();
    expect(canonicalStoryIds[0]).toEqual('story_2');
    expect(canonicalStoryIds[1]).toEqual('story_3');
    expect(canonicalStoryIds[2]).toEqual('story_1');

    TopicUpdateService.rearrangeCanonicalStory(_sampleTopic, 2, 0);
    canonicalStoryIds = _sampleTopic.getCanonicalStoryIds();
    expect(canonicalStoryIds[0]).toEqual('story_1');
    expect(canonicalStoryIds[1]).toEqual('story_2');
    expect(canonicalStoryIds[2]).toEqual('story_3');

    UndoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getCanonicalStoryIds().length).toEqual(3);
    canonicalStoryIds = _sampleTopic.getCanonicalStoryIds();
    expect(canonicalStoryIds[0]).toEqual('story_2');
    expect(canonicalStoryIds[1]).toEqual('story_3');
    expect(canonicalStoryIds[2]).toEqual('story_1');

    TopicUpdateService.rearrangeCanonicalStory(_sampleTopic, 2, 0);
    canonicalStoryIds = _sampleTopic.getCanonicalStoryIds();
    expect(canonicalStoryIds[0]).toEqual('story_1');
    expect(canonicalStoryIds[1]).toEqual('story_2');
    expect(canonicalStoryIds[2]).toEqual('story_3');
  });

  it('should rearrange a skill in a subtopic', function() {
    sampleTopicBackendObject.topicDict.subtopics[0].skill_ids = [
      'skill_id_1', 'skill_id_2', 'skill_id_3'];
    _sampleTopic = TopicObjectFactory.create(
      sampleTopicBackendObject.topicDict,
      sampleTopicBackendObject.skillIdToDescriptionDict);
    let skills = _sampleTopic.getSubtopicById(1).getSkillSummaries();
    expect(skills.length).toEqual(3);
    expect(skills[0].getId()).toEqual('skill_id_1');
    expect(skills[1].getId()).toEqual('skill_id_2');
    expect(skills[2].getId()).toEqual('skill_id_3');

    TopicUpdateService.rearrangeSkillInSubtopic(_sampleTopic, 1, 1, 0);
    skills = _sampleTopic.getSubtopicById(1).getSkillSummaries();
    expect(skills[0].getId()).toEqual('skill_id_2');
    expect(skills[1].getId()).toEqual('skill_id_1');
    expect(skills[2].getId()).toEqual('skill_id_3');

    TopicUpdateService.rearrangeSkillInSubtopic(_sampleTopic, 1, 2, 1);
    skills = _sampleTopic.getSubtopicById(1).getSkillSummaries();
    expect(skills[0].getId()).toEqual('skill_id_2');
    expect(skills[1].getId()).toEqual('skill_id_3');
    expect(skills[2].getId()).toEqual('skill_id_1');

    TopicUpdateService.rearrangeSkillInSubtopic(_sampleTopic, 1, 2, 0);
    skills = _sampleTopic.getSubtopicById(1).getSkillSummaries();
    expect(skills[0].getId()).toEqual('skill_id_1');
    expect(skills[1].getId()).toEqual('skill_id_2');
    expect(skills[2].getId()).toEqual('skill_id_3');

    UndoRedoService.undoChange(_sampleTopic);
    skills = _sampleTopic.getSubtopicById(1).getSkillSummaries();
    expect(skills[0].getId()).toEqual('skill_id_2');
    expect(skills[1].getId()).toEqual('skill_id_3');
    expect(skills[2].getId()).toEqual('skill_id_1');
    sampleTopicBackendObject.topicDict.subtopics[0].skill_ids = ['skill_2'];
  });

  it('should rearrange a subtopic', function() {
    var subtopicsDict = [{id: 2, title: 'Title2', skill_ids: []},
      {id: 3, title: 'Title3', skill_ids: []}];
    sampleTopicBackendObject.topicDict.subtopics.push(...subtopicsDict);

    _sampleTopic = TopicObjectFactory.create(
      sampleTopicBackendObject.topicDict,
      sampleTopicBackendObject.skillIdToDescriptionDict);
    var subtopics = _sampleTopic.getSubtopics();
    expect(subtopics.length).toEqual(3);
    expect(subtopics[0].getId()).toEqual(1);
    expect(subtopics[1].getId()).toEqual(2);
    expect(subtopics[2].getId()).toEqual(3);

    TopicUpdateService.rearrangeSubtopic(_sampleTopic, 1, 0);
    subtopics = _sampleTopic.getSubtopics();
    expect(subtopics[0].getId()).toEqual(2);
    expect(subtopics[1].getId()).toEqual(1);
    expect(subtopics[2].getId()).toEqual(3);

    TopicUpdateService.rearrangeSubtopic(_sampleTopic, 2, 1);
    subtopics = _sampleTopic.getSubtopics();
    expect(subtopics[0].getId()).toEqual(2);
    expect(subtopics[1].getId()).toEqual(3);
    expect(subtopics[2].getId()).toEqual(1);

    TopicUpdateService.rearrangeSubtopic(_sampleTopic, 2, 0);
    subtopics = _sampleTopic.getSubtopics();
    expect(subtopics[0].getId()).toEqual(1);
    expect(subtopics[1].getId()).toEqual(2);
    expect(subtopics[2].getId()).toEqual(3);

    UndoRedoService.undoChange(_sampleTopic);
    subtopics = _sampleTopic.getSubtopics();
    expect(subtopics[0].getId()).toEqual(2);
    expect(subtopics[1].getId()).toEqual(3);
    expect(subtopics[2].getId()).toEqual(1);
    sampleTopicBackendObject.topicDict.subtopics = [{
      id: 1,
      title: 'Title',
      skill_ids: ['skill_2']
    }];
  });

  it('should create a proper backend change dict for adding a subtopic',
    function() {
      TopicUpdateService.addSubtopic(_sampleTopic, 'Title2');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'add_subtopic',
        subtopic_id: 2,
        title: 'Title2'
      }]);
    }
  );

  it('should remove/add a subtopic', function() {
    expect(_sampleTopic.getSubtopics().length).toEqual(1);
    TopicUpdateService.deleteSubtopic(_sampleTopic, 1);
    expect(_sampleTopic.getSubtopics()).toEqual([]);
    expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([
      _firstSkillSummary, _secondSkillSummary
    ]);

    expect(function() {
      UndoRedoService.undoChange(_sampleTopic);
    }).toThrowError('A deleted subtopic cannot be restored');
  });

  it('should properly remove/add a newly created subtopic', function() {
    TopicUpdateService.addSubtopic(_sampleTopic, 'Title2');
    TopicUpdateService.addSubtopic(_sampleTopic, 'Title3');
    expect(_sampleTopic.getSubtopics()[1].getId()).toEqual(2);
    expect(_sampleTopic.getSubtopics()[2].getId()).toEqual(3);
    expect(_sampleTopic.getNextSubtopicId()).toEqual(4);

    TopicUpdateService.deleteSubtopic(_sampleTopic, 2);
    expect(_sampleTopic.getSubtopics().length).toEqual(2);
    expect(_sampleTopic.getSubtopics()[1].getTitle()).toEqual('Title3');
    expect(_sampleTopic.getSubtopics()[1].getId()).toEqual(2);
    expect(_sampleTopic.getNextSubtopicId()).toEqual(3);

    expect(UndoRedoService.getChangeCount()).toEqual(1);
  });

  it('should create a proper backend change dict for deleting ' +
    'a subtopic', function() {
    TopicUpdateService.deleteSubtopic(_sampleTopic, 1);
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'delete_subtopic',
      subtopic_id: 1
    }]);
  }
  );

  it('should not create a backend change dict for deleting a subtopic ' +
    'when an error is encountered', function() {
    expect(function() {
      TopicUpdateService.deleteSubtopic(_sampleTopic, 10);
    }).toThrowError('Subtopic doesn\'t exist');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([]);
  });

  it('should not create a backend change dict for moving subtopic' +
    'when error is thrown', function() {
    expect(function() {
      TopicUpdateService.moveSkillToSubtopic(_sampleTopic, 1, null, undefined);
    }).toThrowError('New subtopic cannot be null');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([]);
  });

  it('should move/undo move a skill id to a subtopic', function() {
    expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([
      _firstSkillSummary
    ]);
    expect(_sampleTopic.getSubtopics()[0].getSkillSummaries()).toEqual([
      _secondSkillSummary
    ]);
    TopicUpdateService.moveSkillToSubtopic(
      _sampleTopic, null, 1, _firstSkillSummary);
    expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([]);
    expect(_sampleTopic.getSubtopics()[0].getSkillSummaries()).toEqual([
      _secondSkillSummary, _firstSkillSummary
    ]);

    /** Undo back to uncategorized */
    UndoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([
      _firstSkillSummary
    ]);
    expect(_sampleTopic.getSubtopics()[0].getSkillSummaries()).toEqual([
      _secondSkillSummary
    ]);

    /**
     * Undo back to old subtopic
     *  Move to _sampleTopic, move to _sampleTopic2, then undo
     */
    TopicUpdateService.addSubtopic(_sampleTopic, 'Title 2');

    TopicUpdateService.moveSkillToSubtopic(
      _sampleTopic, null, 1, _firstSkillSummary);
    expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([]);
    expect(_sampleTopic.getSubtopics()[0].getSkillSummaries()).toEqual([
      _secondSkillSummary, _firstSkillSummary
    ]);

    TopicUpdateService.moveSkillToSubtopic(
      _sampleTopic, 1, 2, _firstSkillSummary);
    expect(_sampleTopic.getSubtopics()[0].getSkillSummaries()).toEqual(
      [_secondSkillSummary]);
    expect(_sampleTopic.getSubtopics()[1].getSkillSummaries()).toEqual(
      [_firstSkillSummary]);

    UndoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([]);
    expect(_sampleTopic.getSubtopics()[0].getSkillSummaries()).toEqual([
      _secondSkillSummary, _firstSkillSummary
    ]);
  });

  it('should correctly create changelists when moving a skill to a newly ' +
    'created subtopic that has since been deleted', function() {
    TopicUpdateService.addSubtopic(_sampleTopic, 'Title 2');
    TopicUpdateService.moveSkillToSubtopic(
      _sampleTopic, null, 2, _firstSkillSummary
    );
    TopicUpdateService.removeSkillFromSubtopic(
      _sampleTopic, 2, _firstSkillSummary
    );
    TopicUpdateService.deleteSubtopic(_sampleTopic, 2);
    expect(UndoRedoService.getCommittableChangeList()).toEqual([]);

    TopicUpdateService.addSubtopic(_sampleTopic, 'Title 2');
    TopicUpdateService.moveSkillToSubtopic(
      _sampleTopic, 1, 2, _secondSkillSummary
    );
    TopicUpdateService.moveSkillToSubtopic(
      _sampleTopic, 2, 1, _secondSkillSummary
    );
    TopicUpdateService.deleteSubtopic(_sampleTopic, 2);
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'remove_skill_id_from_subtopic',
      skill_id: 'skill_2',
      subtopic_id: 1
    }, {
      cmd: 'move_skill_id_to_subtopic',
      skill_id: 'skill_2',
      new_subtopic_id: 1,
      old_subtopic_id: null
    }]);
    UndoRedoService.clearChanges();

    TopicUpdateService.addSubtopic(_sampleTopic, 'Title 2');
    TopicUpdateService.moveSkillToSubtopic(
      _sampleTopic, null, 2, _firstSkillSummary
    );
    TopicUpdateService.moveSkillToSubtopic(
      _sampleTopic, 1, 2, _secondSkillSummary
    );
    TopicUpdateService.deleteSubtopic(_sampleTopic, 2);
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'remove_skill_id_from_subtopic',
      skill_id: 'skill_2',
      subtopic_id: 1
    }]);
  });

  it('should create properly decrement subtopic ids of later subtopics when ' +
    'a newly created subtopic is deleted', function() {
    TopicUpdateService.addSubtopic(_sampleTopic, 'Title 2');
    TopicUpdateService.addSubtopic(_sampleTopic, 'Title 3');
    TopicUpdateService.moveSkillToSubtopic(
      _sampleTopic, 1, 3, _secondSkillSummary
    );
    TopicUpdateService.deleteSubtopic(_sampleTopic, 2);
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'add_subtopic',
      title: 'Title 3',
      subtopic_id: 2
    }, {
      cmd: 'move_skill_id_to_subtopic',
      old_subtopic_id: 1,
      new_subtopic_id: 2,
      skill_id: 'skill_2'
    }]);
  });

  it('should properly decrement subtopic ids of moved subtopics ' +
    'when a newly created subtopic is deleted', function() {
    TopicUpdateService.addSubtopic(_sampleTopic, 'Title 2');
    TopicUpdateService.addSubtopic(_sampleTopic, 'Title 3');
    TopicUpdateService.addSubtopic(_sampleTopic, 'Title 4');

    TopicUpdateService.moveSkillToSubtopic(
      _sampleTopic, 1, 3, _secondSkillSummary
    );
    TopicUpdateService.moveSkillToSubtopic(
      _sampleTopic, 3, 4, _secondSkillSummary
    );
    TopicUpdateService.deleteSubtopic(_sampleTopic, 2);
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'add_subtopic',
      title: 'Title 3',
      subtopic_id: 2
    }, {
      cmd: 'add_subtopic',
      title: 'Title 4',
      subtopic_id: 3
    }, {
      cmd: 'move_skill_id_to_subtopic',
      old_subtopic_id: 1,
      new_subtopic_id: 2,
      skill_id: 'skill_2'
    }, {
      cmd: 'move_skill_id_to_subtopic',
      old_subtopic_id: 2,
      new_subtopic_id: 3,
      skill_id: 'skill_2'
    }]);
  });

  it('should create a proper backend change dict for moving a skill id to a ' +
    'subtopic', function() {
    TopicUpdateService.moveSkillToSubtopic(
      _sampleTopic, null, 1, _firstSkillSummary);
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'move_skill_id_to_subtopic',
      old_subtopic_id: null,
      new_subtopic_id: 1,
      skill_id: 'skill_1'
    }]);
  });

  it('should not create a backend change dict for moving a skill id to a' +
    'subtopic when an error is encountered', function() {
    expect(function() {
      TopicUpdateService.moveSkillToSubtopic(
        _sampleTopic, null, 1, _secondSkillSummary);
    }).toThrowError('Given skillId is not an uncategorized skill.');
    expect(function() {
      TopicUpdateService.moveSkillToSubtopic(
        _sampleTopic, 1, 2, _secondSkillSummary);
    }).toThrowError('Cannot read property \'addSkill\' of null');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([]);
  });

  it('should remove a skill id from a subtopic', function() {
    expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([
      _firstSkillSummary
    ]);
    expect(_sampleTopic.getSubtopics()[0].getSkillSummaries()).toEqual([
      _secondSkillSummary
    ]);
    TopicUpdateService.removeSkillFromSubtopic(
      _sampleTopic, 1, _secondSkillSummary);
    expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([
      _firstSkillSummary, _secondSkillSummary
    ]);
    expect(_sampleTopic.getSubtopics()[0].getSkillSummaries()).toEqual([]);

    UndoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([
      _firstSkillSummary
    ]);
    expect(_sampleTopic.getSubtopics()[0].getSkillSummaries()).toEqual([
      _secondSkillSummary
    ]);
  });

  it('should create a proper backend change dict for removing a skill id ' +
    'from a subtopic', function() {
    TopicUpdateService.removeSkillFromSubtopic(
      _sampleTopic, 1, _secondSkillSummary);
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'remove_skill_id_from_subtopic',
      subtopic_id: 1,
      skill_id: 'skill_2'
    }]);
  });

  it('should not create a backend change dict for removing a skill id from a' +
    'subtopic when an error is encountered', function() {
    expect(function() {
      TopicUpdateService.removeSkillFromSubtopic(
        _sampleTopic, 1, _firstSkillSummary);
    }).toThrowError('The given skill doesn\'t exist in the subtopic');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([]);
  });

  it('should set/unset changes to a subtopic page\'s page content', function() {
    var newSampleSubtitledHtmlDict = {
      html: 'new content',
      content_id: 'content'
    };
    var newSampleSubtitledHtml =
      subtitledHtmlObjectFactory.createFromBackendDict(
        newSampleSubtitledHtmlDict);
    expect(_sampleSubtopicPage.getPageContents().toBackendDict()).toEqual({
      subtitled_html: {
        html: 'test content',
        content_id: 'content'
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {
            en: {
              filename: 'test.mp3',
              file_size_bytes: 100,
              needs_update: false,
              duration_secs: 0.1
            }
          }
        }
      }
    });
    TopicUpdateService.setSubtopicPageContentsHtml(
      _sampleSubtopicPage, 1, newSampleSubtitledHtml);
    expect(_sampleSubtopicPage.getPageContents().toBackendDict()).toEqual({
      subtitled_html: {
        html: 'new content',
        content_id: 'content'
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {
            en: {
              filename: 'test.mp3',
              file_size_bytes: 100,
              needs_update: false,
              duration_secs: 0.1
            }
          }
        }
      }
    });

    UndoRedoService.undoChange(_sampleSubtopicPage);
    expect(_sampleSubtopicPage.getPageContents().toBackendDict()).toEqual({
      subtitled_html: {
        html: 'test content',
        content_id: 'content'
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {
            en: {
              filename: 'test.mp3',
              file_size_bytes: 100,
              needs_update: false,
              duration_secs: 0.1
            }
          }
        }
      }
    });
  });

  it('should create a proper backend change dict for changing ' +
    'html data', function() {
    var newSampleSubtitledHtmlDict = {
      html: 'new content',
      content_id: 'content'
    };
    var newSampleSubtitledHtml =
      subtitledHtmlObjectFactory.createFromBackendDict(
        newSampleSubtitledHtmlDict);
    TopicUpdateService.setSubtopicPageContentsHtml(
      _sampleSubtopicPage, 1, newSampleSubtitledHtml);
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_subtopic_page_property',
      property_name: 'page_contents_html',
      subtopic_id: 1,
      new_value: newSampleSubtitledHtml.toBackendDict(),
      old_value: {
        html: 'test content',
        content_id: 'content'
      }
    }]);
  }
  );

  it('should set/unset changes to a subtopic page\'s audio data', function() {
    var newRecordedVoiceoversDict = {
      voiceovers_mapping: {
        content: {
          en: {
            filename: 'test_2.mp3',
            file_size_bytes: 1000,
            needs_update: false,
            duration_secs: 1.0
          }
        }
      }
    };
    var newVoiceovers = recordedVoiceoversObjectFactory.createFromBackendDict(
      newRecordedVoiceoversDict);

    expect(_sampleSubtopicPage.getPageContents().toBackendDict()).toEqual({
      subtitled_html: {
        html: 'test content',
        content_id: 'content'
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {
            en: {
              filename: 'test.mp3',
              file_size_bytes: 100,
              needs_update: false,
              duration_secs: 0.1
            }
          }
        }
      }
    });

    TopicUpdateService.setSubtopicPageContentsAudio(
      _sampleSubtopicPage, 1, newVoiceovers);
    expect(_sampleSubtopicPage.getPageContents().toBackendDict()).toEqual({
      subtitled_html: {
        html: 'test content',
        content_id: 'content'
      },
      recorded_voiceovers: newRecordedVoiceoversDict
    });

    UndoRedoService.undoChange(_sampleSubtopicPage);
    expect(_sampleSubtopicPage.getPageContents().toBackendDict()).toEqual({
      subtitled_html: {
        html: 'test content',
        content_id: 'content'
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {
            en: {
              filename: 'test.mp3',
              file_size_bytes: 100,
              needs_update: false,
              duration_secs: 0.1
            }
          }
        }
      }
    });
  });

  it('should create a proper backend change dict for changing subtopic ' +
     'page audio data', function() {
    var newRecordedVoiceoversDict = {
      voiceovers_mapping: {
        content: {
          en: {
            filename: 'test_2.mp3',
            file_size_bytes: 1000,
            needs_update: false,
            duration_secs: 1.0
          }
        }
      }
    };
    var newVoiceovers = recordedVoiceoversObjectFactory.createFromBackendDict(
      newRecordedVoiceoversDict);
    TopicUpdateService.setSubtopicPageContentsAudio(
      _sampleSubtopicPage, 1, newVoiceovers);
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_subtopic_page_property',
      property_name: 'page_contents_audio',
      subtopic_id: 1,
      new_value: newVoiceovers.toBackendDict(),
      old_value: {
        voiceovers_mapping: {
          content: {
            en: {
              filename: 'test.mp3',
              file_size_bytes: 100,
              needs_update: false,
              duration_secs: 0.1
            }
          }
        }
      }
    }]);
  });
});
