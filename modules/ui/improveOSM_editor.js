import { dispatch as d3_dispatch } from 'd3-dispatch';

import { t } from '../util/locale';
import { services } from '../services';
import { modeBrowse } from '../modes';
import { svgIcon } from '../svg';

import {
    uiImproveOsmDetails,
    uiImproveOsmHeader,
    uiQuickLinks,
    uiTooltipHtml
} from './index';

import { utilRebind } from '../util';


export function uiImproveOsmEditor(context) {
    var dispatch = d3_dispatch('change');
    var errorDetails = uiImproveOsmDetails(context);
    var errorHeader = uiImproveOsmHeader(context);
    var quickLinks = uiQuickLinks();

    var _error;


    function improveOsmEditor(selection) {
        // quick links
        var choices = [{
            id: 'zoom_to',
            label: 'inspector.zoom_to.title',
            tooltip: function() {
                return uiTooltipHtml(t('inspector.zoom_to.tooltip_issue'), t('inspector.zoom_to.key'));
            },
            click: function zoomTo() {
                context.mode().zoomToSelected();
            }
        }];


        var header = selection.selectAll('.header')
            .data([0]);

        var headerEnter = header.enter()
            .append('div')
            .attr('class', 'header fillL');

        headerEnter
            .append('button')
            .attr('class', 'fr keepRight-editor-close')
            .on('click', function() {
                context.enter(modeBrowse(context));
            })
            .call(svgIcon('#iD-icon-close'));

        headerEnter
            .append('h3')
            .text(t('QA.improveOSM.title'));


        var body = selection.selectAll('.body')
            .data([0]);

        body = body.enter()
            .append('div')
            .attr('class', 'body')
            .merge(body);

        var editor = body.selectAll('.keepRight-editor')
            .data([0]);

        editor.enter()
            .append('div')
            .attr('class', 'modal-section keepRight-editor')
            .merge(editor)
            .call(errorHeader.error(_error))
            .call(quickLinks.choices(choices))
            .call(errorDetails.error(_error))
            .call(improveOsmSaveSection);
    }

    function improveOsmSaveSection(selection) {
        var isSelected = (_error && _error.id === context.selectedErrorID());
        var isShown = (_error && (isSelected || _error.newComment || _error.comment));
        var saveSection = selection.selectAll('.error-save')
            .data(
                (isShown ? [_error] : []),
                function(d) { return d.id + '-' + (d.status || 0); }
            );

        // exit
        saveSection.exit()
            .remove();

        // enter
        var saveSectionEnter = saveSection.enter()
            .append('div')
            .attr('class', 'keepRight-save save-section cf');

        // update
        saveSection = saveSectionEnter
            .merge(saveSection)
            .call(errorSaveButtons);
    }

    function errorSaveButtons(selection) {
        var isSelected = (_error && _error.id === context.selectedErrorID());
        var buttonSection = selection.selectAll('.buttons')
            .data((isSelected ? [_error] : []), function(d) { return d.status + d.id; });

        // exit
        buttonSection.exit()
            .remove();

        // enter
        var buttonEnter = buttonSection.enter()
            .append('div')
            .attr('class', 'buttons');

        // Comments don't currently work
        // buttonEnter
        //     .append('button')
        //     .attr('class', 'button comment-button action')
        //     .text(t('QA.keepRight.save_comment'));

        buttonEnter
            .append('button')
            .attr('class', 'button close-button action');

        buttonEnter
            .append('button')
            .attr('class', 'button ignore-button action');


        // update
        buttonSection = buttonSection
            .merge(buttonEnter);

        // Comments don't currently work
        // buttonSection.select('.comment-button')
        //     .attr('disabled', function(d) {
        //         return d.newComment === undefined ? true : null;
        //     })
        //     .on('click.comment', function(d) {
        //         this.blur();    // avoid keeping focus on the button - #4641
        //         var errorService = services.improveOSM;
        //         if (errorService) {
        //             errorService.postUpdate(d, function(err, error) {
        //                 dispatch.call('change', error);
        //             });
        //         }
        //     });

        buttonSection.select('.close-button')
            .text(function(d) {
                var andComment = (d.newComment !== undefined ? '_comment' : '');
                return t('QA.keepRight.close' + andComment);
            })
            .on('click.close', function(d) {
                this.blur();    // avoid keeping focus on the button - #4641
                var errorService = services.improveOSM;
                if (errorService) {
                    d.newStatus = 'SOLVED';
                    errorService.postUpdate(d, function(err, error) {
                        dispatch.call('change', error);
                    });
                }
            });

        buttonSection.select('.ignore-button')
            .text(function(d) {
                var andComment = (d.newComment !== undefined ? '_comment' : '');
                return t('QA.keepRight.ignore' + andComment);
            })
            .on('click.ignore', function(d) {
                this.blur();    // avoid keeping focus on the button - #4641
                var errorService = services.improveOSM;
                if (errorService) {
                    d.newStatus = 'INVALID';
                    errorService.postUpdate(d, function(err, error) {
                        dispatch.call('change', error);
                    });
                }
            });
    }

    improveOsmEditor.error = function(val) {
        if (!arguments.length) return _error;
        _error = val;
        return improveOsmEditor;
    };


    return utilRebind(improveOsmEditor, dispatch, 'on');
}
