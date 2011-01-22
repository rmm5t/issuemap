$(document).ready(function() {
  $(".preprocess-form").preprocessData(MapFormUpload.init());
  $("fieldset.required").sniffForCompletion();
  $("fieldset.required").sniffForSubmittable(".actions button[type=submit]");
  $("textarea.copyable").copyable();
  $("#pointer").stepAlongFieldsets();
});

$(window).unload(function() {
  if (typeof $.unblockUI != "undefined" && $.unblockUI !== null) {
    $.unblockUI();
  }
});

var MapFormUpload = {
  init: function() {
    this.automateTitleGuessing();
    this.displayColumnSamples();
    $("form#new_map").pleaseWaitOnSubmit();
    return this;
  },
  success: function(data) {
    console.log(data);

    var importSection = $(".import");
    var postSection = $(".post-process");
    
    postSection.slideDown(function() { importSection.markCompleted(true); });
    $("select.column-names").setColumnOptions(data.column_names, data.column_details);
    $("#map_original_csv_data").val(data.csv).change();
    $("#map_location_column_name").val(data.guessed_location_column).change();
    $("#map_data_column_name").val(data.guessed_data_column).change();
    $("#map_location_column_type").val(null).change();
    $("#map_data_column_type").val(null).change();
  },
  error: function(data) {
    console.log("ERROR!");
    console.log(data);

    var importSection = $(".import");
    var postSection = $(".post-process");
    importSection.markCompleted(false);
    postSection.slideUp();
    $("select.column-names").setOptions([]);
    $("#map_original_csv_data").val(null);
    $("#map_location_column_name").val(null);
    $("#map_data_column_name").val(null);
    $("#map_location_column_type").val(null);
    $("#map_data_column_type").val(null);
  },
  automateTitleGuessing: function() {
    var dataColumn = $("#map_data_column_name");
    var locationColumn = $("#map_location_column_name");
    $("#map_title").suggestable();
    var suggestTitle = function () {
      var title = [dataColumn.val() || "Data", locationColumn.val() || "Location"].join(" by ");
      $("#map_title").suggestValue(title);
    };
    dataColumn.change(suggestTitle);
    locationColumn.change(suggestTitle);
  },
  displayColumnSamples: function() {
    $("select.column-names").change(function () {
      var samples = $(this).find(":selected").attr("data-samples") + ", ...";
      $(this).parents("fieldset").find(".hint").text(samples);
    });
  }
};

$.fn.stepAlongFieldsets = function() {
  return this.stepAlong("fieldset[data-step]", ":not(.completed):first", "completed");
};

// Automatically and immediately upload either a selected file or the
// copy-n-pasted data for a map.  Afterwards, populate the rest of map creation
// form with guessed defaults based on the ajax response.
$.fn.preprocessData = function(options) {
  options = options || {};
  return this.each(function() {
    var form = $(this);
    form[0].reset();

    var submitForm = function(callback) {
      form.ajaxSubmit({
        beforeSubmit: function(a,f,o) {
          o.dataType = 'json';
        },
        complete: function(request, textStatus) {
          var data = $.parseJSON(request.responseText);
          if (data.error) {
            if (options.error) options.error(data);
          } else {
            if (options.success) options.success(data);
          }
          if (callback) callback(data);
        }
      });
    };

    var fileInput = form.find("input[type=file]");
    var pasteArea = form.find("textarea");

    fileInput.change(function() {
      submitForm(function() { form[0].reset(); });
    });

    pasteArea.valueChangeObserver(500, function() {
      submitForm();
    });
  });
};

$.fn.sniffForCompletion = function() {
  return this.each(function() {
    var fieldset = $(this);
    var inputs = fieldset.find(":input");
    inputs.change(function() { 
      var allFilled = _.all(inputs, function(input) { return $(input).val() && !$(input).hasClass("suggested"); });
      fieldset.markCompleted(allFilled);
    }).change();
  });
};

$.fn.sniffForSubmittable = function(submit) {
  var inputs = this.find(":input");
  inputs.change(function() { 
    var allFilled = _.all(inputs, function(input) { return $(input).val(); });
    if (allFilled) {
      $(submit).removeAttr("disabled"); 
    } else {
      $(submit).attr("disabled", "disabled"); 
    }
  }).change();
  return this;
};

$.fn.markCompleted = function(on) {
  var hadClass = this.hasClass("completed");
  if (on) this.addClass("completed"); 
  else    this.removeClass("completed"); 
  if (hadClass ? !on : on) { this.trigger("completed"); } // XOR
};

$.fn.suggestable = function() {
  this.focus(function() { $(this).removeClass("suggested"); })
      .blur(function() { $(this).change(); }); // triggers possible "completion" upon acceptance of suggested value
};

$.fn.suggestValue = function(text) {
  return this.each(function() {
    var input = $(this);  
    if (input.hasClass("suggested") || input.val() == input.attr("data-suggested") || input.val().length == 0) {
      input.val(text);
      input.addClass("suggested");
    }
    input.attr("data-suggested", text);
  });
};

$.fn.setColumnOptions = function(names, details) {
  return this.each(function() {
    var select = $(this);
    select.empty();
    _.each(names, function(name) {
      var samples = details[name].samples.join(", ");
      select.append(
        $("<option />")
          .val(name).text(name)
          .attr("data-samples", samples)
          .attr("data-guessed_type", details[name].guessed_type));
    });
  });
};

$.fn.pleaseWaitOnSubmit = function() {
  this.submit(function () { 
    $.blockUI({ 
      css: { 
        border: "none", 
        padding: "0.5em", 
        backgroundColor: "#000", 
        "-webkit-border-radius": "0.5em", 
        "-moz-border-radius": "0.5em", 
        opacity: 0.75, 
        color: "#fff",
        "font-size": "2em",
        "line-height": "1.5"
      }
     }); 
  });
};

$.fn.copyable = function() {
  this.attr("readonly", "readonly");
  this.click(function() { this.select(); });
  this.focus(function() { this.select(); });

  if (this.size() == 0) return this;
  if (!$.copyable.available()) return this;
  return this.each(function() {
    var text = $(this);
    var buttonSelector = $(this).attr("rel");
    var button = $(buttonSelector);
    button.show();
    
    var clip = new ZeroClipboard.Client();

    clip.setHandCursor(true);
    clip.addEventListener('mouseOver', function() { clip.setText(text.val()); });

    clip.addEventListener('complete', function (client, text) {
      if (!button.attr("data-original-text")) {
        button.attr("data-original-text", button.text());
      }
      button.text("Copied!");
      setTimeout(function() { button.text(button.attr("data-original-text")); }, 2000);
    });

    clip.glue(button.attr("id"));
  });
};
$.copyable = {};
$.copyable.available = function() {
  if (FlashDetect.installed && !$.copyable.loaded) {
    $("<script>").attr("src", "/javascripts/ZeroClipboard.js").appendTo("head");
    $.copyable.loaded = true;
  }
  return FlashDetect.installed;
};

$.fn.stepAlong = function(selector, qualifier, eventType) {
  var pointerMethods = {
    positionFor: function(element) {
      var pointerWidth  = this.outerWidth();
      var pointerHeight = this.outerHeight();
      var elementWidth  = element.outerWidth();
      var elementHeight = element.outerHeight();
      var elementPosition = element.position();
  
      return {
        top: elementPosition.top + (elementHeight / 2) - (pointerHeight / 2),
        left: elementPosition.left - pointerWidth
      };
    },
    jumpTo: function(element) {
      if (element.size() == 0) { return this.fadeOut(); }
      this.css(this.positionFor(element));
      this.find("div").text(element.attr("data-step"));
      return this.fadeIn();
    },
    animateTo: function(element) {
      if (element.size() == 0) { return this.fadeOut(); }
      this.show();
      var stepText = this.find("div");
        stepText.text(element.attr("data-step"));
      // stepText.fadeOut(function() {
      //   stepText.text(element.attr("data-step"));
      //   stepText.fadeIn();
      // });
      return this.animate(this.positionFor(element));
    },
    moveTo: function(element) {
      if (this.is(":visible")) {
        return this.animateTo(element);
      } else {
        if (element.size() == 0) { return this; }
        return this.jumpTo(element);
      }
    }
  };
  return this.each(function() {
    var pointer = $.extend($(this), pointerMethods);
    var move = function () { pointer.moveTo($(selector + qualifier)); };
    $(selector).bind("completed", move);
    $(window).delayedResize(function() { pointer.stop(); move(); });
    move();
  });
};

$.fn.delayedResize = function(callback) {
  var t;
  return this.resize(function() { 
    if (t) { clearTimeout(t); }
    t = setTimeout(callback, 300);
  });
};

// Monitors a field for value changes every interval and fires the callback
// function only when a change is recognized.  This is good for monitoring an
// input or textarea field for copy-n-pasted changes that could come from
// keypresses, mouse context menus, or application menus.
$.fn.valueChangeObserver = function(interval, callback) {
  return this.each(function() {
    var self = $(this);
    var lastValue = self.val();
    var check = function() {
      var value = self.val();
      if (value != lastValue) {
        callback(self);
        lastValue = value;
      }
    };
    setInterval(check, interval);
  });
};

// protection against accidental left-over console.log statements
if (typeof console === "undefined" || console === null) {
  console = { log: function() { } };
}
