//////////////////////////////////////////////////
// Silex, live web creation
// http://projects.silexlabs.org/?/silex/
//
// Copyright (c) 2012 Silex Labs
// http://www.silexlabs.org/
//
// Silex is available under the GPL license
// http://www.silexlabs.org/silex/silex-licensing/
//////////////////////////////////////////////////

/**
 * @fileoverview
 *   This class represents a Silex component, which is attached to a DOM element
 *   It has methods to manipulate the DOM element
 *
 */


goog.provide('silex.model.Component');



/**
 * @constructor
 * @param  {Element}  element  DOM element which I'll represent
 * @param  {string} opt_context   optional name of a context, I'll set
 *     the component in that state immediately - default value is state normal
 */
silex.model.Component = function(element, opt_context) {
    this.isEditable = false;
    // store a reference to the editable component
    this.element = this.getFirstEditableParent(element);
    // store component type
    this.type = silex.model.Component.getType(this.element);
    // default value for context
    if (!opt_context)
        opt_context = silex.model.Component.CONTEXT_NORMAL;
    // apply the style for the context
    this.setContext(opt_context);
};


/**
 * contexts of an element
 */
silex.model.Component.CONTEXT_NORMAL = 'normal';
silex.model.Component.CONTEXT_HOVER = 'hover';
silex.model.Component.CONTEXT_PRESSED = 'pressed';


/**
 * constant for silex element type
 */
silex.model.Component.TYPE_CONTAINER = 'container';


/**
 * constant for silex element type
 * a page is an "a" anchor tag with name set to the page id, and the innerHTML is the page full title
 */
silex.model.Component.TYPE_PAGE = 'page';


/**
 * constant for silex element type
 */
silex.model.Component.TYPE_ELEMENT = 'element';


/**
 * constant for silex element type
 */
silex.model.Component.SUBTYPE_IMAGE = 'image';


/**
 * constant for silex element type
 */
silex.model.Component.SUBTYPE_TEXT = 'text';


/**
 * constant for silex element type
 */
silex.model.Component.SUBTYPE_HTML = 'html';


/**
 * element
 */
silex.model.Component.prototype.element;


/**
 * context
 */
silex.model.Component.prototype.context;


/**
 * type
 */
silex.model.Component.getType = function(element) {
    var type = element.getAttribute('data-silex-type');
    var subType = element.getAttribute('data-silex-sub-type');
    switch (type) {
        case silex.model.Component.TYPE_CONTAINER:
            return type;
        case silex.model.Component.TYPE_ELEMENT:
            return subType;
    }
    throw ('Could not determine the type of this element.');
};


/**
 * retrieve the first parent which is visible only on some pages
 * @return null or the element or one of its parents which has the css class silex.model.Page.PAGE_CLASS
 */
silex.model.Component.prototype.getFirstPageableParent = function() {
    var element = this.element.parentNode;
    while (element && !goog.dom.classes.has(element, silex.model.Page.PAGE_CLASS)) {
        element = element.parentNode;
    }
    return element;
};


/**
 * retrieve the element to which I attach the new elements
 * 'this' is expected to be the stage
 */
silex.model.Component.prototype.getBackgroundElement = function() {
    var elements = goog.dom.getElementsByClass('background', this.element);
    if (elements.length > 0) return elements[0];
    return this.element;
};


/**
 * context getter/setter
 */
silex.model.Component.prototype.getContext = function() {
    return this.context;
};


/**
 * context getter/setter
 */
silex.model.Component.prototype.setContext = function(context) {
    this.context = context;
    this.setStyle(this.getStyle(context), context);
};


/**
 * style with position and size
 * to set the css style, use setStyle or setBoundingBox
 * @return the css style object
 */
silex.model.Component.prototype.getCss = function(opt_context) {
    // default value for the state
    if (!opt_context) {
        opt_context = this.context;
    }
    // retrieve the element style
    var styleStr = this.element.getAttribute('data-style-' + opt_context);
    if (!styleStr) {
        styleStr = '';
        //return null;
    }
    // parse the style string
    var style = silex.Helper.stringToStyle(styleStr);

    // compute the final style object without the undefined and '' values
    var finalStyle = {};
    goog.object.forEach(style, function(val, index, obj) {
        if (val && val !== '') {
            finalStyle[index] = val;
        }
    }, this);
    return finalStyle;
};


/**
 * @return true if the component has a css style object for the given context
 */
silex.model.Component.prototype.hasStyle = function(opt_context) {
    // default value for the state
    if (!opt_context) {
        opt_context = this.context;
    }
    // retrieve the element style
    var styleStr = this.element.getAttribute('data-style-' + opt_context);
    if (styleStr) {
        return true;
    }
    return false;
};


/**
 * style without position and size
 */
silex.model.Component.prototype.getStyle = function(opt_context) {

    var style = this.getCss(opt_context);

    // remove the position and size values
    style.top = undefined;
    style.left = undefined;
    style.width = undefined;
    style.height = undefined;
    style.bottom = undefined;
    style.right = undefined;
    style.zIndex = undefined;
    style.position = undefined;

    // compute the final style object without the undefined and '' values
    var finalStyle = {};
    goog.object.forEach(style, function(val, index, obj) {
        if (val && val !== '') {
            finalStyle[index] = val;
        }
    }, this);
    // return the style
    return finalStyle;
};


/**
 * style
 */
silex.model.Component.prototype.setStyle = function(style, opt_context) {
    if (!style) {
        // case of stage and context with no style yet
        //return;
        style = {};
    }
    // default value for the state
    if (!opt_context) {
        opt_context = this.context;
    }
    var styleStr = '';
    goog.object.forEach(style, function(val, index, obj) {
        if (val) {
            // do not keep 'no image' info, simply remove the style
            if (val === 'none') {
                val = null;
            }
            else {
                //build the string
                styleStr += goog.string.toSelectorCase(index) + ': ' + val + '; ';
            }

            // apply to the view
            // compare with current style before applying style
            // to prevent flickering
            // remove ' from value because some browsers modifies bg image
            // and adds ' (e.g. chrome)
            var sanitized = val.replace(/\'/g, '');
            if (this.element.style[index] !== sanitized){
	            goog.style.setStyle(this.element, index, val);
            }
        }
    }, this);
    // add the bounding box if needed
    if (opt_context === silex.model.Component.CONTEXT_NORMAL) {
        var bb = this.getBoundingBox();
        styleStr += 'top: ' + bb.top + '; ';
        styleStr += 'left: ' + bb.left + '; ';
        styleStr += 'width: ' + bb.width + '; ';
        styleStr += 'height: ' + bb.height + '; ';
        styleStr += 'bottom: ' + bb.bottom + '; ';
        styleStr += 'right: ' + bb.right + '; ';
        styleStr += 'z-index: ' + bb.zIndex + '; ';
        styleStr += 'position: absolute; ';
    }
    // store in the model
    if (styleStr !== '') {
    		if (this.element.getAttribute('data-style-' + opt_context)!==styleStr){
	        this.element.setAttribute('data-style-' + opt_context, styleStr);
    		}
    }
    else {
        this.element.removeAttribute('data-style-' + opt_context);
    }
};


/**
 * bounding box
 * key/value pairs of string with unit, e.g. '5px'
 */
silex.model.Component.prototype.getBoundingBox = function() {
    return {
        top: goog.style.getStyle(this.element, 'top'),
        left: goog.style.getStyle(this.element, 'left'),
        width: goog.style.getStyle(this.element, 'width'),
        height: goog.style.getStyle(this.element, 'height'),
        bottom: goog.style.getStyle(this.element, 'bottom'),
        right: goog.style.getStyle(this.element, 'right'),
        zIndex: goog.style.getStyle(this.element, 'zIndex')
    };
};


/**
 * bounding box
 * key/value pairs of string with unit, e.g. '5px'
 */
silex.model.Component.prototype.setBoundingBox = function(boundingBox) {
    goog.style.setStyle(this.element, 'position', 'absolute');
    // change the view, move/resize the dom element
    if (boundingBox.top) goog.style.setStyle(this.element, 'top', boundingBox.top);
    else goog.style.setStyle(this.element, 'top', null);
    if (boundingBox.left) goog.style.setStyle(this.element, 'left', boundingBox.left);
    else goog.style.setStyle(this.element, 'left', null);
    if (boundingBox.width) goog.style.setStyle(this.element, 'width', boundingBox.width);
    else goog.style.setStyle(this.element, 'width', null);
    if (boundingBox.height) goog.style.setStyle(this.element, 'height', boundingBox.height);
    else goog.style.setStyle(this.element, 'height', null);
    if (boundingBox.bottom) goog.style.setStyle(this.element, 'bottom', boundingBox.bottom);
    else goog.style.setStyle(this.element, 'bottom', null);
    if (boundingBox.right) goog.style.setStyle(this.element, 'right', boundingBox.right);
    else goog.style.setStyle(this.element, 'right', null);
    if (boundingBox.zIndex) goog.style.setStyle(this.element, 'zIndex', boundingBox.zIndex);
    else goog.style.setStyle(this.element, 'zIndex', null);

    // get the data-style-normal attribute as a css object
    var style = this.getCss(silex.model.Component.CONTEXT_NORMAL);
    // update the model
    style.top = boundingBox.top;
    style.left = boundingBox.left;
    style.width = boundingBox.width;
    style.height = boundingBox.height;
    style.bottom = boundingBox.bottom;
    style.right = boundingBox.right;
    style.zIndex = boundingBox.zIndex;
    // build a string out of the style object
    var styleStr = silex.Helper.styleToString(style);

    // store it in the data-style-normal attribute
    this.element.setAttribute('data-style-' + silex.model.Component.CONTEXT_NORMAL, styleStr);
};


/**
 * image source
 */
silex.model.Component.prototype.getImageSrc = function() {
    if (this.type === silex.model.Component.SUBTYPE_IMAGE) {
        var img = goog.dom.getElementsByTagNameAndClass('img', null, this.element)[0];
        if (img) {
            return img.getAttribute('src');
        }
        else {
            console.error('The image element inside the component could not be found. Canot get the source.');
        }
    }
    else {
        console.error('The component is not an image, canot get the source.');
    }
    return '';
};


/**
 * image source
 */
silex.model.Component.prototype.setImageSrc = function(url) {
    if (this.type === silex.model.Component.SUBTYPE_IMAGE) {
        var img = goog.dom.getElementsByTagNameAndClass('img', null, this.element)[0];
        if (img) {
            return img.setAttribute('src', url);
        }
        else {
            console.error('The image element inside the component could not be found. Canot set the source.');
        }
    }
    else {
        console.error('The component is not an image, canot set the source.');
    }
};


/**
 * get raw html content
 */
silex.model.Component.prototype.getHtml = function(opt_baseUrl) {
    // apply the data-style-normal to all nodes
    this.applyStateToAllComponents('normal');

    // unregister jquery plugin
    this.setEditable(false);

    // remove all markup linked to the "editable" jquery plugin
    var cleanContainer = this.element.cloneNode(true);

    // register jquery plugin
    this.setEditable(true);

    // get the result as a string
    var htmlString = '';
    if (this.type == silex.model.Component.SUBTYPE_HTML) {
        // html boxes have a container for the html
        var htmlContent = goog.dom.getFirstElementChild(cleanContainer);
        if (htmlContent) {
            htmlString = htmlContent.innerHTML;
        }
    }
    else {
        // others have their content right inside the element
        htmlString = cleanContainer.innerHTML;
    }

    // relative URLs when possible
    if (opt_baseUrl) {
        opt_baseUrl = silex.Helper.getAbsolutePath(opt_baseUrl, silex.Helper.BaseUrl);
        //this.absolute2relative(opt_baseUrl, cleanContainer);
        htmlString = this.absolute2Relative(htmlString, opt_baseUrl);
    }

    // return the html content
    return htmlString;
};


/**
 * set html content
 * make it editable and with absolute urls
 */
silex.model.Component.prototype.setHtml = function(html, opt_baseUrl) {
    // unregister jquery plugin
    this.setEditable(false);
    // absolute URLs when possible
    if (opt_baseUrl) {
        opt_baseUrl = silex.Helper.getAbsolutePath(opt_baseUrl, silex.Helper.BaseUrl);
        html = this.relative2absolute(html, opt_baseUrl);
    }
    else {
        console.warn('setHtml without base url, the URLs could not be converted to absolute');
    }
    // set the html content
    if (this.type == silex.model.Component.SUBTYPE_HTML) {
        // html boxes have a container for the html
        var htmlContent = goog.dom.getFirstElementChild(this.element);
        if (htmlContent) {
            htmlContent.innerHTML = html;
        }
    }
    else {
        // others have their content right inside the element
        this.element.innerHTML = html;
    }
    // restore editing
    this.setEditable(true);
};


/**
 * find the first editable parent
 */
silex.model.Component.prototype.getFirstEditableParent = function(element) {
    var child = element;
    // go through all parents untill it is editable
    while (child && child.getAttribute && !this.getEditable(child)) {
        child = child.parentNode;
    }
    // return the first editable element
    if (child && child.getAttribute && this.getEditable(child)) {
        return child;
    }
    else {
        // The component has no editable parent
        // This is the case of the stage
    }
    return element;
};


/**
 * lock/unlock
 * this makes the component selectable but not draggable nor resizable
 */
silex.model.Component.prototype.getLocked = function(opt_element) {
    // default value for the element
    if (!opt_element) {
        opt_element = this.element;
    }
    return $(opt_element).hasClass('locked-style');
};


/**
 * lock/unlock
 * this makes the component selectable but not draggable nor resizable
 */
silex.model.Component.prototype.setLocked = function(isLocked, opt_element) {
    // default value for the element
    if (!opt_element) {
        opt_element = this.element;
    }
    // lock/unlock plugin
    if (isLocked) {
        if (!$(opt_element).hasClass('locked-style')) {
            $(opt_element).addClass('locked-style');
        }
    }
    else {
        if ($(opt_element).hasClass('locked-style')) {
            $(opt_element).removeClass('locked-style');
        }
    }
    this.setEditable(!isLocked, opt_element);
};


/**
 * init or remove the editable jquery plugin
 * if opt_element element to set as editable, optional, this.element is default
 */
silex.model.Component.prototype.getEditable = function(opt_element) {
    // default value for the element
    if (!opt_element) {
        opt_element = this.element;
    }
    return $(opt_element).hasClass('editable-style');
};


/**
 * init or remove the editable jquery plugin
 * if opt_element element to set as editable, optional, this.element is default
 */
silex.model.Component.prototype.setEditable = function(isEditable, opt_element) {
    // default value for the element
    if (!opt_element) {
        opt_element = this.element;
    }
    // activate editable plugin
    if (isEditable) {
        $('.editable-style[data-silex-type="container"]', opt_element).each(function() {
            if ($(this).hasClass('locked-style')) return;
            $(this).editable({
                isContainer: true
            });
        });
        $('.editable-style[data-silex-type="element"]', opt_element).editable();

        // the root element (is not editable when it is the stage, i.e. has no css class 'editable-style')
        if (this.getEditable(opt_element)) {
            if ($(this).hasClass('locked-style')) return;
            var type = opt_element.getAttribute('data-silex-type');
            if (type === silex.model.Component.TYPE_CONTAINER) {
                $(opt_element).editable({
                    isContainer: true
                });
            }
            else {
                $(opt_element).editable();
            }
        }
    }
    // deactivate editable plugin
    else {
        $('[data-silex-type="container"]', opt_element).editable('destroy');
        $('[data-silex-type="element"]', opt_element).editable('destroy');

        // the root element (is not editable when it is the stage, i.e. has no css class 'editable-style')
        if (this.getEditable(opt_element)) {
            $(opt_element).editable('destroy');
        }

        // cleanup the dom
        $(opt_element).find('.silex-selected').removeClass('silex-selected');
        $(opt_element).find('.ui-resizable').removeClass('ui-resizable');
        $(opt_element).find('.ui-draggable').removeClass('ui-draggable');
        $(opt_element).find('.ui-droppable').removeClass('ui-droppable');
        $(opt_element).find('[aria-disabled]').removeAttr('aria-disabled');
        $(opt_element).find('.ui-resizable-handle').remove();
    }
    this.isEditable = isEditable;
};


/**
 * Browse the children and convert all URLs to relative when possible
 * this will not work, because element.style.backgroundImage is reevaluated when set to a relative value
 */
silex.model.Component.prototype.absolute2Relative = function(htmlString, baseUrl) {
    // image source
    htmlString = htmlString.replace(/src="?([^" ]*)" /g, function(match, group1, group2) {
        var res = match.replace(group1, silex.Helper.getRelativePath(group1, baseUrl));
        return res;
    });
    // css url()
    htmlString = htmlString.replace(/url\((['"])(.+?)\1\)/g, function(match, group1, group2) {
        var res = "url('" + silex.Helper.getRelativePath(group2, baseUrl) + "')";
        return res;
    });
    return htmlString;
};


/**
 * convert all URLs to absolute
 */
silex.model.Component.prototype.relative2absolute = function(htmlString, baseUrl) {
    // image source
    htmlString = htmlString.replace(/src="?([^" ]*)" /g, function(match, group1, group2) {
        var res = match.replace(group1, silex.Helper.getAbsolutePath(group1, baseUrl));
        return res;
    });
    // css url()
    htmlString = htmlString.replace(/url\((['"])(.+?)\1\)/g, function(match, group1, group2) {
        var res = "url('" + silex.Helper.getAbsolutePath(group2, baseUrl) + "')";
        return res;
    });
    return htmlString;
};


/**
 * apply a given state to all chlidren
 */
silex.model.Component.prototype.applyStateToAllComponents = function(state) {
    // apply the data-style-normal or data-style-* to all nodes
    $('[data-style-normal]').each(function() {
        var styleStr = this.getAttribute('data-style-' + state);
        if (styleStr !== null)
            this.setAttribute('style', styleStr);
        else
            this.setAttribute('style', this.getAttribute('data-style-normal'));
    });
};


/**
 * component creation
 * create a DOM element, attach it to this container
 * and returns a new component for the element
 */
silex.model.Component.prototype.addContainer = function() {
    if (this.type !== silex.model.Component.TYPE_CONTAINER) {
        throw ('Canot create a child component for this component because it is not of type ' + silex.model.Component.TYPE_CONTAINER);
    }
    // create the conatiner
    var div = goog.dom.createElement('div');
    div.className = 'editable-style';
    div.setAttribute('data-silex-type', silex.model.Component.TYPE_CONTAINER);
    // attach it
    var container = this.getBackgroundElement();
    goog.dom.appendChild(container, div);
    // make it editable
    this.setEditable(true, div);
    // create the component instance
    var component = new silex.model.Component(div);
    // set bounding box
    var bb = {};
    bb.left = '100px';
    bb.top = '100px';
    bb.height = '100px';
    bb.width = '100px';
    component.setBoundingBox(bb);
    // set default style
    var style = {};
    style.backgroundColor = 'rgba(255, 255, 255, 1)';
    //style.overflow = 'hidden';
    component.setStyle(style, silex.model.Component.CONTEXT_NORMAL);
    // return a component for this element
    return component;
};


/**
 * component creation
 * create a DOM element, attach it to this container
 * and returns a new component for the element
 */
silex.model.Component.prototype.addText = function() {
    if (this.type !== silex.model.Component.TYPE_CONTAINER) {
        throw ('Canot create a child component for this component because it is not of type ' + silex.model.Component.TYPE_CONTAINER);
    }
    // create the element
    var div = goog.dom.createElement('div');
    div.className = 'editable-style';
    div.setAttribute('data-silex-type', silex.model.Component.TYPE_ELEMENT);
    div.setAttribute('data-silex-sub-type', silex.model.Component.SUBTYPE_TEXT);
    div.innerHTML = 'New text box';
    // attach it
    var container = this.getBackgroundElement();
    goog.dom.appendChild(container, div);
    // make it editable
    this.setEditable(true, div);
    // create the component instance
    var component = new silex.model.Component(div);
    // set bounding box
    var bb = {};
    bb.left = '100px';
    bb.top = '100px';
    bb.height = '100px';
    bb.width = '100px';
    component.setBoundingBox(bb);
    // set default style
    var style = {};
    style.backgroundColor = 'rgba(255, 255, 255, 1)';
    //style.overflow = 'hidden';
    component.setStyle(style, silex.model.Component.CONTEXT_NORMAL);
    // return a component for this element
    return component;
};


/**
 * component creation
 * create a DOM element, attach it to this container
 * and returns a new component for the element
 */
silex.model.Component.prototype.addHtml = function() {
    if (this.type !== silex.model.Component.TYPE_CONTAINER) {
        throw ('Canot create a child component for this component because it is not of type ' + silex.model.Component.TYPE_CONTAINER);
    }
    // create the element
    var div = goog.dom.createElement('div');
    div.className = 'editable-style';
    div.setAttribute('data-silex-type', silex.model.Component.TYPE_ELEMENT);
    div.setAttribute('data-silex-sub-type', silex.model.Component.SUBTYPE_HTML);

    var htmlContent = goog.dom.createElement('div');
    htmlContent.className = 'html-content';
    htmlContent.innerHTML = '<p>New HTML box</p>';
    goog.style.setStyle(htmlContent, 'width', '100%');
    goog.style.setStyle(htmlContent, 'height', '100%');

    // attach it all
    var container = this.getBackgroundElement();
    goog.dom.appendChild(container, div);
    goog.dom.appendChild(div, htmlContent);

    // make it editable
    this.setEditable(true, div);
    // create the component instance
    var component = new silex.model.Component(div);
    // set bounding box
    var bb = {};
    bb.left = '100px';
    bb.top = '100px';
    bb.height = '100px';
    bb.width = '100px';
    component.setBoundingBox(bb);
    // set default style
    var style = {};
    style.backgroundColor = 'rgba(255, 255, 255, 1)';
    //style.overflow = 'hidden';
    component.setStyle(style, silex.model.Component.CONTEXT_NORMAL);
    // return a component for this element
    return component;
};


/**
 * component creation
 * create a DOM element, attach it to this container
 * and returns a new component for the element
 */
silex.model.Component.prototype.addImage = function(url) {
    if (this.type !== silex.model.Component.TYPE_CONTAINER) {
        throw ('Canot create a child component for this component because it is not of type ' + silex.model.Component.TYPE_CONTAINER);
    }
    if (!url) {
        console.error('No URL provided for the image component');
    }
    var div = goog.dom.createElement('div');
    div.className = 'editable-style';
    div.setAttribute('data-silex-type', silex.model.Component.TYPE_ELEMENT);
    div.setAttribute('data-silex-sub-type', silex.model.Component.SUBTYPE_IMAGE);

    var img = goog.dom.createElement('img');
    goog.style.setStyle(img, 'width', '100%');
    goog.style.setStyle(img, 'height', '100%');

    // attach it all
    var container = this.getBackgroundElement();
    goog.dom.appendChild(container, div);
    goog.dom.appendChild(div, img);

    // create the component instance
    var component = new silex.model.Component(div);
    // set bounding box
    var bb = {};
    bb.left = '100px';
    bb.top = '100px';
    component.setBoundingBox(bb);

    // start loading
    img.setAttribute('src', url);

    img.onload = function(e) {
        // set container size to match image size
        bb.width = img.offsetWidth + 'px';
        bb.height = img.offsetHeight + 'px';
        component.setBoundingBox(bb);
        // make it editable
        component.setEditable(true, div);
    };
    // return a component for this element
    return component;
};


/**
 * remove elements
 */
silex.model.Component.prototype.remove = function(component) {
    if (!goog.dom.contains(this.element, component.element)) {
        throw ('Canot remove this component because it is not my children.');
    }
    goog.dom.removeNode(component.element);
};


/**
 * link
 */
silex.model.Component.prototype.removeLink = function() {
    this.element.removeAttribute('data-silex-href');
};


/**
 * link
 */
silex.model.Component.prototype.setLink = function(url) {
    this.element.setAttribute('data-silex-href', url);
};


/**
 * link
 */
silex.model.Component.prototype.getLink = function() {
    return this.element.getAttribute('data-silex-href');
};


/**
 * mark selection
 */
silex.model.Component.prototype.setSelected = function(isSelected) {
    if (isSelected) {
        goog.dom.classes.add(this.element, 'silex-selected');
    }
    else {
        goog.dom.classes.remove(this.element, 'silex-selected');
    }
};


/**
 * mark selection
 */
silex.model.Component.prototype.getSelected = function() {
    return goog.dom.classes.has(this.element, 'silex-selected');
};


/**
 * add a class
 */
silex.model.Component.prototype.addClass = function(className) {
    goog.dom.classes.add(this.element, className);
};


/**
 * remove a class
 */
silex.model.Component.prototype.removeClass = function(className) {
    goog.dom.classes.remove(this.element, className);
};


/**
 * get css classes
 */
silex.model.Component.prototype.getClasses = function() {
    return goog.dom.classes.get(this.element);
};


/**
 * set css classes
 */
silex.model.Component.prototype.getClasses = function(classes) {
    return goog.dom.classes.set(this.element, classes);
};


/**
 * check if the component has a given css class
 */
silex.model.Component.prototype.hasClass = function(className) {
    return goog.dom.classes.has(this.element, className);
};
